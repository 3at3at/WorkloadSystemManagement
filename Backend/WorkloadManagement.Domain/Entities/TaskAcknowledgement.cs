namespace WorkloadManagement.Domain.Entities
{
    public class TaskAcknowledgement
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;

        public int MemberId { get; set; }
        public User Member { get; set; } = null!;

        public bool IsAcknowledged { get; set; } = false;
        public DateTime? AcknowledgedAt { get; set; }
    }
}