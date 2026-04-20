using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Domain.Entities
{
    public class TaskApproval
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;

        public int RequestedByUserId { get; set; }
        public User RequestedByUser { get; set; } = null!;

        public int TargetApproverUserId { get; set; }
        public User TargetApproverUser { get; set; } = null!;

        public int? ApprovedByUserId { get; set; }
        public User? ApprovedByUser { get; set; }

        public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

        public string RequestReason { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovedAt { get; set; }
    }
}