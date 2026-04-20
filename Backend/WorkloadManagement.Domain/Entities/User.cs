namespace WorkloadManagement.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
        public ICollection<TaskItem> CreatedTasks { get; set; } = new List<TaskItem>();

        public ICollection<TaskAcknowledgement> TaskAcknowledgements { get; set; } = new List<TaskAcknowledgement>();
        public ICollection<TaskApproval> RequestedApprovals { get; set; } = new List<TaskApproval>();
        public ICollection<TaskApproval> ApprovedActions { get; set; } = new List<TaskApproval>();
        public ICollection<TaskApproval> ApprovalRequestsToReview { get; set; } = new List<TaskApproval>();
        public int? TeamLeaderId { get; set; }
        public User? TeamLeader { get; set; }
        public ICollection<User> TeamMembers { get; set; } = new List<User>();
    }
}