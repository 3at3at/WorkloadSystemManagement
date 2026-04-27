using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Tasks;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;
using TaskStatusEnum = WorkloadManagement.Domain.Enums.TaskStatus;

namespace WorkloadManagement.Tests.Services
{
    public class TaskServiceTests
    {
        private readonly Mock<ITaskRepository> _taskRepo = new();
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<INotificationService> _notificationService = new();
        private readonly TaskService _sut;

        public TaskServiceTests()
        {
            _sut = new TaskService(_taskRepo.Object, _userRepo.Object, _notificationService.Object);
            _notificationService.Setup(n => n.CreateAsync(It.IsAny<Application.DTOs.Notifications.CreateNotificationDto>())).Returns(Task.CompletedTask);
            _notificationService.Setup(n => n.CreateManyAsync(It.IsAny<IEnumerable<Application.DTOs.Notifications.CreateNotificationDto>>())).Returns(Task.CompletedTask);
        }

        // ── GetAllTasks ───────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllTasksAsync_ReturnsMappedTasks()
        {
            var task = EntityFactory.Task();
            task.AssignedToUser = EntityFactory.MemberUser();
            task.CreatedByUser = EntityFactory.LeaderUser();
            _taskRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new[] { task });

            var result = await _sut.GetAllTasksAsync();

            result.Should().HaveCount(1);
        }

        // ── GetMyTasks ────────────────────────────────────────────────────────

        [Fact]
        public async Task GetMyTasksAsync_ReturnsOnlyAssignedTasks()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            task.AssignedToUser = EntityFactory.MemberUser();
            task.CreatedByUser = EntityFactory.LeaderUser();
            _taskRepo.Setup(r => r.GetTasksByUserIdAsync(3)).ReturnsAsync(new[] { task });

            var result = await _sut.GetMyTasksAsync(3);

            result.Should().HaveCount(1);
            result.First().AssignedToUserId.Should().Be(3);
        }

        // ── GetTaskById ───────────────────────────────────────────────────────

        [Fact]
        public async Task GetTaskByIdAsync_ExistingTask_ReturnsDetails()
        {
            var task = EntityFactory.Task();
            task.AssignedToUser = EntityFactory.MemberUser();
            task.CreatedByUser = EntityFactory.LeaderUser();
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

            var result = await _sut.GetTaskByIdAsync(1);

            result.Should().NotBeNull();
            result!.Id.Should().Be(1);
        }

        [Fact]
        public async Task GetTaskByIdAsync_NonExistingTask_ReturnsNull()
        {
            _taskRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((TaskItem?)null);

            var result = await _sut.GetTaskByIdAsync(99);

            result.Should().BeNull();
        }

        // ── CreateTask ────────────────────────────────────────────────────────

        [Fact]
        public async Task CreateTaskAsync_ByAdmin_CreatesTaskAndReturnsDto()
        {
            var admin = EntityFactory.AdminUser();
            var member = EntityFactory.MemberUser();
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);
            _taskRepo.Setup(r => r.AddAsync(It.IsAny<TaskItem>())).Returns(Task.CompletedTask);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.CreateTaskAsync(new CreateTaskDto
            {
                Title = "New Task",
                Description = "Desc",
                AssignedToUserId = 3,
                Priority = TaskPriority.High,
                Complexity = TaskComplexity.Medium,
                EstimatedHours = 5,
                StartDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(7)
            }, createdByUserId: 1);

            result.Title.Should().Be("New Task");
            result.AssignedToUserId.Should().Be(3);
        }

        [Fact]
        public async Task CreateTaskAsync_AssignedUserNotFound_Throws()
        {
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

            var act = () => _sut.CreateTaskAsync(new CreateTaskDto
            {
                AssignedToUserId = 99,
                DueDate = DateTime.UtcNow.AddDays(7)
            }, createdByUserId: 1);

            await act.Should().ThrowAsync<Exception>().WithMessage("*Assigned user not found*");
        }

        [Fact]
        public async Task CreateTaskAsync_TeamLeaderAssignsToNonOwnMember_Throws()
        {
            var leader = EntityFactory.LeaderUser(id: 2);
            var otherMember = EntityFactory.MemberUser(id: 5, teamLeaderId: 99); // belongs to different leader
            _userRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(otherMember);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(leader);

            var act = () => _sut.CreateTaskAsync(new CreateTaskDto
            {
                AssignedToUserId = 5,
                DueDate = DateTime.UtcNow.AddDays(7)
            }, createdByUserId: 2);

            await act.Should().ThrowAsync<Exception>().WithMessage("*own team members*");
        }

        // ── DeleteTask ────────────────────────────────────────────────────────

        [Fact]
        public async Task DeleteTaskAsync_AdminDeletesAnyTask_ReturnsTrue()
        {
            var admin = EntityFactory.AdminUser();
            var task = EntityFactory.Task();
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.DeleteTaskAsync(1, currentUserId: 1);

            result.Should().BeTrue();
            _taskRepo.Verify(r => r.Delete(It.IsAny<TaskItem>()), Times.Once);
        }

        [Fact]
        public async Task DeleteTaskAsync_NonExistingTask_ReturnsFalse()
        {
            _taskRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((TaskItem?)null);

            var result = await _sut.DeleteTaskAsync(99, currentUserId: 1);

            result.Should().BeFalse();
        }

        // ── UpdateMyTaskStatus ────────────────────────────────────────────────

        [Fact]
        public async Task UpdateMyTaskStatusAsync_OwnTask_UpdatesStatus()
        {
            var task = EntityFactory.Task(assignedToUserId: 3, createdByUserId: 2);
            var member = EntityFactory.MemberUser(id: 3);
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.UpdateMyTaskStatusAsync(1, new UpdateMyTaskStatusDto
            {
                Status = TaskStatusEnum.InProgress
            }, currentUserId: 3);

            result.Should().NotBeNull();
            task.Status.Should().Be(TaskStatusEnum.InProgress);
        }

        [Fact]
        public async Task UpdateMyTaskStatusAsync_NotOwnTask_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

            var act = () => _sut.UpdateMyTaskStatusAsync(1, new UpdateMyTaskStatusDto
            {
                Status = TaskStatusEnum.InProgress
            }, currentUserId: 99);

            await act.Should().ThrowAsync<Exception>().WithMessage("*own assigned tasks*");
        }

        // ── CompleteMyTask ────────────────────────────────────────────────────

        [Fact]
        public async Task CompleteMyTaskAsync_OwnTask_SetsCompletedStatus()
        {
            var task = EntityFactory.Task(assignedToUserId: 3, createdByUserId: 2);
            var member = EntityFactory.MemberUser(id: 3);
            var creator = EntityFactory.LeaderUser(id: 2);
            task.AssignedToUser = member;
            task.CreatedByUser = creator;
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(creator);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.CompleteMyTaskAsync(1, memberId: 3);

            result.Should().NotBeNull();
            task.Status.Should().Be(TaskStatusEnum.Completed);
        }

        [Fact]
        public async Task CompleteMyTaskAsync_NotOwnTask_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);

            var act = () => _sut.CompleteMyTaskAsync(1, memberId: 99);

            await act.Should().ThrowAsync<Exception>().WithMessage("*own assigned tasks*");
        }

        // ── Weight calculation ────────────────────────────────────────────────

        [Theory]
        [InlineData(4, TaskComplexity.Medium, TaskPriority.Medium, 4 * 1.5 * 1.2)]   // 7.2
        [InlineData(8, TaskComplexity.Hard, TaskPriority.Critical, 8 * 2.0 * 2.0)]    // 32
        [InlineData(2, TaskComplexity.Easy, TaskPriority.Low, 2 * 1.0 * 1.0)]         // 2
        public async Task CreateTaskAsync_Weight_IsCalculatedCorrectly(
            int hours, TaskComplexity complexity, TaskPriority priority, double expectedWeight)
        {
            var admin = EntityFactory.AdminUser();
            var member = EntityFactory.MemberUser();
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);
            _taskRepo.Setup(r => r.AddAsync(It.IsAny<TaskItem>())).Returns(Task.CompletedTask);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            TaskItem? captured = null;
            _taskRepo.Setup(r => r.AddAsync(It.IsAny<TaskItem>()))
                .Callback<TaskItem>(t => captured = t)
                .Returns(Task.CompletedTask);

            await _sut.CreateTaskAsync(new CreateTaskDto
            {
                AssignedToUserId = 3,
                EstimatedHours = hours,
                Complexity = complexity,
                Priority = priority,
                DueDate = DateTime.UtcNow.AddDays(7)
            }, createdByUserId: 1);

            captured.Should().NotBeNull();
            ((double)captured!.Weight).Should().BeApproximately(expectedWeight, 0.001);
        }
    }
}
