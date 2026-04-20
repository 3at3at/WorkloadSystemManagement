using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Domain.Interfaces
{
    public interface ITaskRepository : IGenericRepository<TaskItem>
    {
        Task<IEnumerable<TaskItem>> GetTasksByUserIdAsync(int userId);
        Task<IEnumerable<TaskItem>> GetTasksByWeekAsync(int weekNumber, int year);
        Task<IEnumerable<TaskItem>> GetTasksByUserAndWeekAsync(int userId, int weekNumber, int year);
        Task<IEnumerable<TaskItem>> GetTasksByStatusAsync(string status);
    }
}