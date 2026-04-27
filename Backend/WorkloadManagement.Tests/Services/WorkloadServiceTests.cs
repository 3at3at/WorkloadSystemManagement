using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;

namespace WorkloadManagement.Tests.Services
{
    public class WorkloadServiceTests
    {
        private readonly Mock<ITaskRepository> _taskRepo = new();
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ITaskAcknowledgementRepository> _ackRepo = new();
        private readonly Mock<INotificationService> _notificationService = new();
        private readonly WorkloadService _sut;

        public WorkloadServiceTests()
        {
            _sut = new WorkloadService(_taskRepo.Object, _userRepo.Object, _ackRepo.Object, _notificationService.Object);
            _notificationService.Setup(n => n.CreateAsync(It.IsAny<CreateNotificationDto>())).Returns(Task.CompletedTask);
        }

        // ── AcknowledgeTask ───────────────────────────────────────────────────

        [Fact]
        public async Task AcknowledgeTaskAsync_FirstTime_CreatesAcknowledgement()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _ackRepo.Setup(r => r.GetByTaskAndMemberAsync(1, 3)).ReturnsAsync((TaskAcknowledgement?)null);
            _ackRepo.Setup(r => r.AddAsync(It.IsAny<TaskAcknowledgement>())).Returns(Task.CompletedTask);
            _ackRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.AcknowledgeTaskAsync(taskId: 1, memberId: 3);

            result.IsAcknowledged.Should().BeTrue();
            result.TaskId.Should().Be(1);
            result.MemberId.Should().Be(3);
            _ackRepo.Verify(r => r.AddAsync(It.IsAny<TaskAcknowledgement>()), Times.Once);
        }

        [Fact]
        public async Task AcknowledgeTaskAsync_AlreadyAcknowledged_UpdatesExisting()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3);
            var existing = new TaskAcknowledgement { TaskItemId = 1, MemberId = 3, IsAcknowledged = false };

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _ackRepo.Setup(r => r.GetByTaskAndMemberAsync(1, 3)).ReturnsAsync(existing);
            _ackRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.AcknowledgeTaskAsync(taskId: 1, memberId: 3);

            result.IsAcknowledged.Should().BeTrue();
            _ackRepo.Verify(r => r.Update(existing), Times.Once);
        }

        [Fact]
        public async Task AcknowledgeTaskAsync_TaskNotFound_Throws()
        {
            _taskRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((TaskItem?)null);

            var act = () => _sut.AcknowledgeTaskAsync(99, memberId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*Task not found*");
        }

        [Fact]
        public async Task AcknowledgeTaskAsync_NotOwnTask_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

            var act = () => _sut.AcknowledgeTaskAsync(1, memberId: 99);

            await act.Should().ThrowAsync<Exception>().WithMessage("*own assigned tasks*");
        }

        // ── GetMemberWeeklyWorkload ────────────────────────────────────────────

        [Fact]
        public async Task GetMemberWeeklyWorkloadAsync_UserNotFound_ReturnsNull()
        {
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

            var result = await _sut.GetMemberWeeklyWorkloadAsync(99, weekNumber: 1, year: 2026);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetMemberWeeklyWorkloadAsync_WithActiveTasks_ReturnsSummedWeight()
        {
            var member = EntityFactory.MemberUser(id: 3);
            // Task spans week 1 only → full weight distributed to that single week
            // Jan 1 2026 is ISO week 1 of 2026 (Jan 1, 2026 is a Thursday)
            var task = new TaskItem
            {
                Id = 1,
                Title = "T",
                AssignedToUserId = 3,
                CreatedByUserId = 2,
                Priority = Domain.Enums.TaskPriority.Medium,
                Complexity = Domain.Enums.TaskComplexity.Medium,
                EstimatedHours = 4,
                Weight = 7.2m,                                    // 4 * 1.5 * 1.2
                StartDate = new DateTime(2026, 1, 1),             // ISO week 1, 2026
                DueDate = new DateTime(2026, 1, 1),
                WeekNumber = 1,
                Year = 2026,
                Status = Domain.Enums.TaskStatus.New
            };

            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(new[] { task });

            var result = await _sut.GetMemberWeeklyWorkloadAsync(3, weekNumber: 1, year: 2026);

            result.Should().NotBeNull();
            result!.TotalWeight.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetMemberWeeklyWorkloadAsync_NoTasksInWeek_ReturnsZeroWeight()
        {
            var member = EntityFactory.MemberUser(id: 3);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(Enumerable.Empty<TaskItem>());

            var result = await _sut.GetMemberWeeklyWorkloadAsync(3, weekNumber: 5, year: 2026);

            result!.TotalWeight.Should().Be(0);
            result.WorkloadStatus.Should().Be("Available");
        }

        // ── GetWeeklyTeamWorkload ─────────────────────────────────────────────

        [Fact]
        public async Task GetWeeklyTeamWorkloadAsync_AdminRole_ReturnsSummary()
        {
            var member = EntityFactory.MemberUser(id: 3);
            _userRepo.Setup(r => r.GetMembersAsync()).ReturnsAsync(new[] { member });
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(Enumerable.Empty<TaskItem>());

            var result = await _sut.GetWeeklyTeamWorkloadAsync(requesterId: 1, requesterRole: "Admin", weekNumber: 1, year: 2026);

            result.Should().NotBeNull();
            result.Members.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetWeeklyTeamWorkloadAsync_LeaderRole_ReturnsOwnMembersOnly()
        {
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            _userRepo.Setup(r => r.GetMembersByTeamLeaderIdAsync(2)).ReturnsAsync(new[] { member });
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(Enumerable.Empty<TaskItem>());

            var result = await _sut.GetWeeklyTeamWorkloadAsync(requesterId: 2, requesterRole: "TeamLeader", weekNumber: 1, year: 2026);

            result.Members.Should().HaveCount(1);
        }

        [Fact]
        public async Task GetWeeklyTeamWorkloadAsync_MemberRole_Throws()
        {
            var act = () => _sut.GetWeeklyTeamWorkloadAsync(requesterId: 3, requesterRole: "Member", weekNumber: 1, year: 2026);

            await act.Should().ThrowAsync<Exception>().WithMessage("*not allowed*");
        }

        // ── WorkloadStatus thresholds ─────────────────────────────────────────

        [Theory]
        [InlineData(0, "Available")]
        [InlineData(9.99, "Available")]
        [InlineData(10, "Balanced")]
        [InlineData(19.99, "Balanced")]
        [InlineData(20, "Overloaded")]
        [InlineData(30, "Overloaded")]
        public async Task GetMemberWeeklyWorkloadAsync_WorkloadStatus_MatchesThresholds(
            double totalWeight, string expectedStatus)
        {
            var member = EntityFactory.MemberUser(id: 3);
            // Single task spanning one day in the target week so full weight is applied to that week
            // Jan 1 2026 is ISO week 1 of 2026 (Jan 1, 2026 is a Thursday)
            var startDate = new DateTime(2026, 1, 1); // ISO week 1 of 2026
            var task = new TaskItem
            {
                Id = 1,
                Title = "T",
                AssignedToUserId = 3,
                CreatedByUserId = 2,
                Weight = (decimal)totalWeight,
                StartDate = startDate,
                DueDate = startDate,
                WeekNumber = 1,
                Year = 2026,
                Status = Domain.Enums.TaskStatus.New
            };

            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(new[] { task });

            var result = await _sut.GetMemberWeeklyWorkloadAsync(3, weekNumber: 1, year: 2026);

            result!.WorkloadStatus.Should().Be(expectedStatus);
        }
    }
}
