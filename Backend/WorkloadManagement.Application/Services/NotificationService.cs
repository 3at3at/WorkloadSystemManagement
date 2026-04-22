using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task CreateAsync(CreateNotificationDto dto)
        {
            try
            {
                if (dto.UserId <= 0)
                    return;

                var notification = new Notification
                {
                    UserId = dto.UserId,
                    Type = dto.Type,
                    Title = dto.Title,
                    Message = dto.Message,
                    RelatedEntityId = dto.RelatedEntityId,
                    ActionUrl = dto.ActionUrl,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationRepository.SaveChangesAsync();
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                // Notifications are optional until the database migration is applied.
            }
        }

        public async Task CreateManyAsync(IEnumerable<CreateNotificationDto> notifications)
        {
            try
            {
                var items = notifications
                    .Where(x => x.UserId > 0)
                    .ToList();

                if (items.Count == 0)
                    return;

                foreach (var dto in items)
                {
                    await _notificationRepository.AddAsync(new Notification
                    {
                        UserId = dto.UserId,
                        Type = dto.Type,
                        Title = dto.Title,
                        Message = dto.Message,
                        RelatedEntityId = dto.RelatedEntityId,
                        ActionUrl = dto.ActionUrl,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _notificationRepository.SaveChangesAsync();
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                // Notifications are optional until the database migration is applied.
            }
        }

        public async Task<IEnumerable<NotificationDto>> GetMyNotificationsAsync(int userId)
        {
            try
            {
                var notifications = await _notificationRepository.GetByUserIdAsync(userId);
                return notifications.Select(MapToDto);
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                return Enumerable.Empty<NotificationDto>();
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            try
            {
                return await _notificationRepository.GetUnreadCountAsync(userId);
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                return 0;
            }
        }

        public async Task<bool> MarkAsReadAsync(int id, int userId)
        {
            try
            {
                var notification = await _notificationRepository.GetByIdForUserAsync(id, userId);
                if (notification == null)
                    return false;

                if (!notification.IsRead)
                {
                    notification.IsRead = true;
                    _notificationRepository.Update(notification);
                    await _notificationRepository.SaveChangesAsync();
                }

                return true;
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                return false;
            }
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            try
            {
                var notifications = await _notificationRepository.GetUnreadByUserIdAsync(userId);

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                    _notificationRepository.Update(notification);
                }

                await _notificationRepository.SaveChangesAsync();
            }
            catch (Exception ex) when (IsMissingNotificationsTable(ex))
            {
                // Notifications are optional until the database migration is applied.
            }
        }

        private static NotificationDto MapToDto(Notification notification)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                Type = notification.Type.ToString(),
                Title = notification.Title,
                Message = notification.Message,
                RelatedEntityId = notification.RelatedEntityId,
                ActionUrl = notification.ActionUrl,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }

        private static bool IsMissingNotificationsTable(Exception ex)
        {
            if (ex.Message.Contains("Invalid object name 'Notifications'", StringComparison.OrdinalIgnoreCase) ||
                ex.Message.Contains("Invalid object name \"Notifications\"", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (ex.InnerException != null)
            {
                return IsMissingNotificationsTable(ex.InnerException);
            }

            return false;
        }
    }
}
