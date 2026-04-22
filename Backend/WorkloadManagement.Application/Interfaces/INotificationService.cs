using WorkloadManagement.Application.DTOs.Notifications;

namespace WorkloadManagement.Application.Interfaces
{
    public interface INotificationService
    {
        Task CreateAsync(CreateNotificationDto dto);
        Task CreateManyAsync(IEnumerable<CreateNotificationDto> notifications);
        Task<IEnumerable<NotificationDto>> GetMyNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task<bool> MarkAsReadAsync(int id, int userId);
        Task MarkAllAsReadAsync(int userId);
    }
}
