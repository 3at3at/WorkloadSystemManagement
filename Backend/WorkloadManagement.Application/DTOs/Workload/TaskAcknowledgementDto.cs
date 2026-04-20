namespace WorkloadManagement.Application.DTOs.Workload
{
    public class TaskAcknowledgementDto
    {
        public int TaskId { get; set; }
        public int MemberId { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
    }
}