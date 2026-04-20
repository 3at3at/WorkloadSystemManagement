using TaskStatusEnum = WorkloadManagement.Domain.Enums.TaskStatus;

namespace WorkloadManagement.Application.DTOs.Tasks
{
    public class UpdateMyTaskStatusDto
    {
        public TaskStatusEnum Status { get; set; }
    }
}