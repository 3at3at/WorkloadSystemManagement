using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Domain.Interfaces
{
    public interface INotificationRepository : IGenericRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, int take = 50);
        Task<int> GetUnreadCountAsync(int userId);
        Task<Notification?> GetByIdForUserAsync(int id, int userId);
        Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId);
    }
}
