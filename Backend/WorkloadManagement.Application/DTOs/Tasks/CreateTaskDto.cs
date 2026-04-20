using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Application.DTOs.Tasks
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AssignedToUserId { get; set; }
        public TaskPriority Priority { get; set; }
        public TaskComplexity Complexity { get; set; }
        public int EstimatedHours { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
    }
}