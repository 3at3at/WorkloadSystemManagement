using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Workload;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;

namespace WorkloadManagement.Tests.Services
{
    public class DashboardServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ITaskRepository> _taskRepo = new();
        private readonly Mock<ITaskApprovalRepository> _approvalRepo = new();
        private readonly Mock<IWorkloadService> _workloadService = new();
        private readonly DashboardService _sut;

        private static readonly WorkloadSummaryDto EmptyWorkloadSummary = new()
        {
            Members = new List<MemberWorkloadDto>(),
            OverloadedCount = 0,
            BalancedCount = 0,
            AvailableCount = 0
        };

        public DashboardServiceTests()
        {
            _sut = new DashboardService(_userRepo.Object, _taskRepo.Object, _approvalRepo.Object, _workloadService.Object);
        }

        // ── Admin Summary ─────────────────────────────────────────────────────

        [Fact]
        public async Task GetAdminSummaryAsync_ReturnsTotals()
        {
            var users = new[] { EntityFactory.LeaderUser(), EntityFactory.MemberUser() };
            var tasks = new[]
            {
                EntityFactory.Task(status: Domain.Enums.TaskStatus.New),
                EntityFactory.Task(id: 2, status: Domain.Enums.TaskStatus.InProgress),
                EntityFactory.Task(id: 3, status: Domain.Enums.TaskStatus.Completed)   // excluded
            };
            var approvals = new[] { EntityFactory.PendingApproval() };

            _userRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(users);
            _taskRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(tasks);
            _approvalRepo.Setup(r => r.GetPendingApprovalsForApproverAsync(1)).ReturnsAsync(approvals);
            _workloadService.Setup(w => w.GetWeeklyTeamWorkloadAsync(1, "Admin", It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(EmptyWorkloadSummary);

            var result = await _sut.GetAdminSummaryAsync(currentUserId: 1, weekNumber: 1, year: 2026);

            result.TotalUsers.Should().Be(2);       // all users except self (id=1 excluded)
            result.TotalTasks.Should().Be(2);        // completed task excluded
            result.PendingApprovals.Should().Be(1);
        }

        [Fact]
        public async Task GetAdminSummaryAsync_ExcludesCurrentUserFromTotalUsers()
        {
            var admin = EntityFactory.AdminUser(id: 1);
            var leader = EntityFactory.LeaderUser(id: 2);
            var member = EntityFactory.MemberUser(id: 3);

            _userRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { admin, leader, member });
            _taskRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(Enumerable.Empty<TaskItem>());
            _approvalRepo.Setup(r => r.GetPendingApprovalsForApproverAsync(1)).ReturnsAsync(Enumerable.Empty<Domain.Entities.TaskApproval>());
            _workloadService.Setup(w => w.GetWeeklyTeamWorkloadAsync(1, "Admin", It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(EmptyWorkloadSummary);

            var result = await _sut.GetAdminSummaryAsync(currentUserId: 1, weekNumber: 1, year: 2026);

            // admin (id=1) is excluded → only leader + member = 2
            result.TotalUsers.Should().Be(2);
        }

        // ── Leader Summary ────────────────────────────────────────────────────

        [Fact]
        public async Task GetLeaderSummaryAsync_ReturnsSummaryForTeam()
        {
            var leader = EntityFactory.LeaderUser(id: 2);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            member.TeamLeader = leader;

            var tasks = new[]
            {
                EntityFactory.Task(assignedToUserId: 2, createdByUserId: 2, status: Domain.Enums.TaskStatus.New),
                EntityFactory.Task(id: 2, assignedToUserId: 3, createdByUserId: 2, status: Domain.Enums.TaskStatus.InProgress),
                EntityFactory.Task(id: 3, status: Domain.Enums.TaskStatus.Completed)  // excluded
            };
            tasks[0].AssignedToUser = leader;
            tasks[1].AssignedToUser = member;

            var approvals = new[] { EntityFactory.PendingApproval(targetApproverId: 2) };

            _userRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new User[] { leader, member });
            _taskRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(tasks);
            _approvalRepo.Setup(r => r.GetPendingApprovalsForApproverAsync(2)).ReturnsAsync(approvals);
            _workloadService.Setup(w => w.GetWeeklyTeamWorkloadAsync(2, "TeamLeader", It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(EmptyWorkloadSummary);

            var result = await _sut.GetLeaderSummaryAsync(leaderId: 2, weekNumber: 1, year: 2026);

            result.PendingApprovals.Should().Be(1);
            result.AssignedTasks.Should().BeGreaterThan(0);
        }

        // ── Member Summary ────────────────────────────────────────────────────

        [Fact]
        public async Task GetMemberSummaryAsync_ReturnsCorrectCounts()
        {
            var tasks = new[]
            {
                EntityFactory.Task(status: Domain.Enums.TaskStatus.New),
                EntityFactory.Task(id: 2, status: Domain.Enums.TaskStatus.New),
                EntityFactory.Task(id: 3, status: Domain.Enums.TaskStatus.Completed)  // excluded
            };

            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(tasks);
            _workloadService.Setup(w => w.GetMemberWeeklyWorkloadAsync(3, It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(new MemberWorkloadDto
                {
                    UserId = 3,
                    TotalWeight = 7.5m,
                    WorkloadStatus = "Available"
                });

            var result = await _sut.GetMemberSummaryAsync(memberId: 3, weekNumber: 1, year: 2026);

            result.MyTasks.Should().Be(2);           // completed excluded
            result.NewTasks.Should().Be(2);
            result.WorkloadStatus.Should().Be("Available");
            result.WeeklyWorkload.Should().Be(7.5m);
        }

        [Fact]
        public async Task GetMemberSummaryAsync_NullWorkload_ReturnsDefaults()
        {
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(Enumerable.Empty<TaskItem>());
            _workloadService.Setup(w => w.GetMemberWeeklyWorkloadAsync(3, It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync((MemberWorkloadDto?)null);

            var result = await _sut.GetMemberSummaryAsync(memberId: 3, weekNumber: 1, year: 2026);

            result.WeeklyWorkload.Should().Be(0);
            result.WorkloadStatus.Should().Be("N/A");
        }
    }
}
