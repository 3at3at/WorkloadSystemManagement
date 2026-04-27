using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Tests.Helpers
{
    /// <summary>
    /// Provides pre-built domain entity instances for use across all test classes.
    /// </summary>
    public static class EntityFactory
    {
        public static Role AdminRole() => new() { Id = 1, Name = RoleType.Admin };
        public static Role LeaderRole() => new() { Id = 2, Name = RoleType.TeamLeader };
        public static Role MemberRole() => new() { Id = 3, Name = RoleType.Member };

        public static User AdminUser(int id = 1) => new()
        {
            Id = id,
            FullName = "Admin User",
            Email = $"admin{id}@test.com",
            PasswordHash = "hashed",
            RoleId = 1,
            Role = AdminRole(),
            IsActive = true
        };

        public static User LeaderUser(int id = 2) => new()
        {
            Id = id,
            FullName = "Leader User",
            Email = $"leader{id}@test.com",
            PasswordHash = "hashed",
            RoleId = 2,
            Role = LeaderRole(),
            IsActive = true
        };

        public static User MemberUser(int id = 3, int? teamLeaderId = 2) => new()
        {
            Id = id,
            FullName = "Member User",
            Email = $"member{id}@test.com",
            PasswordHash = "hashed",
            RoleId = 3,
            Role = MemberRole(),
            IsActive = true,
            TeamLeaderId = teamLeaderId
        };

        public static TaskItem Task(
            int id = 1,
            int assignedToUserId = 3,
            int createdByUserId = 2,
            Domain.Enums.TaskStatus status = Domain.Enums.TaskStatus.New) => new()
        {
            Id = id,
            Title = $"Task {id}",
            Description = "Description",
            AssignedToUserId = assignedToUserId,
            CreatedByUserId = createdByUserId,
            Priority = TaskPriority.Medium,
            Complexity = TaskComplexity.Medium,
            EstimatedHours = 4,
            Weight = 4 * 1.5m * 1.2m,
            StartDate = DateTime.UtcNow.Date,
            DueDate = DateTime.UtcNow.Date.AddDays(7),
            WeekNumber = 1,
            Year = DateTime.UtcNow.Year,
            Status = status
        };

        public static TaskApproval PendingApproval(int id = 1, int taskId = 1, int requestedById = 3, int targetApproverId = 2) => new()
        {
            Id = id,
            TaskItemId = taskId,
            RequestedByUserId = requestedById,
            TargetApproverUserId = targetApproverId,
            ApprovalStatus = ApprovalStatus.Pending,
            RequestReason = "Need approval",
            RequestedAt = DateTime.UtcNow
        };
    }
}
