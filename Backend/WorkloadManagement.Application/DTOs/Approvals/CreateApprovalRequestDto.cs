namespace WorkloadManagement.Application.DTOs.Approvals
{
    public class CreateApprovalRequestDto
    {
        public int TaskId { get; set; }
        public int TargetApproverUserId { get; set; }
        public string RequestReason { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
}
