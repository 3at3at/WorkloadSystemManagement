namespace WorkloadManagement.Application.DTOs.Tasks
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;

        public int AssignedToUserId { get; set; }
        public string AssignedTo { get; set; } = string.Empty;

        public int CreatedByUserId { get; set; }
        public string CreatedBy { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;
        public string Complexity { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int EstimatedHours { get; set; }
        public decimal Weight { get; set; }
        public DateTime DueDate { get; set; }
    }
}