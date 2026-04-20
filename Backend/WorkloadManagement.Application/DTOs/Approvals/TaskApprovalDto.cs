namespace WorkloadManagement.Application.DTOs.Approvals
{
    public class TaskApprovalDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;

        public int RequestedByUserId { get; set; }
        public string RequestedBy { get; set; } = string.Empty;

        public int TargetApproverUserId { get; set; }
        public string TargetApprover { get; set; } = string.Empty;

        public int? ApprovedByUserId { get; set; }
        public string ApprovedBy { get; set; } = string.Empty;

        public string ApprovalStatus { get; set; } = string.Empty;
        public string RequestReason { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}