using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Domain.Entities
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public int AssignedToUserId { get; set; }
        public User AssignedToUser { get; set; } = null!;

        public int CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; } = null!;

        public TaskPriority Priority { get; set; }
        public TaskComplexity Complexity { get; set; }
        public WorkloadManagement.Domain.Enums.TaskStatus Status { get; set; } = WorkloadManagement.Domain.Enums.TaskStatus.New;
        public int EstimatedHours { get; set; }

        public decimal Weight { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }

        public int WeekNumber { get; set; }
        public int Year { get; set; }

        public bool IsMajorChangePendingApproval { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<TaskAcknowledgement> Acknowledgements { get; set; } = new List<TaskAcknowledgement>();
        public ICollection<TaskApproval> Approvals { get; set; } = new List<TaskApproval>();
    }
}