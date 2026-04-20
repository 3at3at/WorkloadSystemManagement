using WorkloadManagement.Application.DTOs.Tasks;

namespace WorkloadManagement.Application.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskDto>> GetAllTasksAsync();
        Task<TaskDetailsDto?> GetTaskByIdAsync(int id);
        Task<IEnumerable<TaskDto>> GetMyTasksAsync(int userId);
        Task<TaskDetailsDto> CreateTaskAsync(CreateTaskDto dto, int createdByUserId);
        Task<TaskDetailsDto?> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId);
        Task<TaskDetailsDto?> UpdateMyTaskStatusAsync(int id, UpdateMyTaskStatusDto dto, int currentUserId);
        Task<bool> DeleteTaskAsync(int id, int currentUserId);
        Task<TaskDetailsDto?> CompleteMyTaskAsync(int id, int memberId);
        Task<IEnumerable<TaskDto>> GetTasksByStatusAsync(string status);
    }
}