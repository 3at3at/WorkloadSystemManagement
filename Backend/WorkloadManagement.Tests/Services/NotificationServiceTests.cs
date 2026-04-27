using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Tests.Services
{
    public class NotificationServiceTests
    {
        private readonly Mock<INotificationRepository> _notificationRepo = new();
        private readonly NotificationService _sut;

        public NotificationServiceTests()
        {
            _sut = new NotificationService(_notificationRepo.Object);
        }

        // ── CreateAsync ───────────────────────────────────────────────────────

        [Fact]
        public async Task CreateAsync_ValidDto_AddsAndSaves()
        {
            _notificationRepo.Setup(r => r.AddAsync(It.IsAny<Notification>())).Returns(Task.CompletedTask);
            _notificationRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await _sut.CreateAsync(new CreateNotificationDto
            {
                UserId = 1,
                Type = NotificationType.TaskAssigned,
                Title = "Title",
                Message = "Msg"
            });

            _notificationRepo.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Once);
            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_InvalidUserId_DoesNotAddNotification()
        {
            await _sut.CreateAsync(new CreateNotificationDto { UserId = 0 });

            _notificationRepo.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Never);
        }

        // ── CreateManyAsync ───────────────────────────────────────────────────

        [Fact]
        public async Task CreateManyAsync_TwoDtos_AddsBothAndSavesOnce()
        {
            _notificationRepo.Setup(r => r.AddAsync(It.IsAny<Notification>())).Returns(Task.CompletedTask);
            _notificationRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await _sut.CreateManyAsync(new[]
            {
                new CreateNotificationDto { UserId = 1, Type = NotificationType.ApprovalSubmitted, Title = "A", Message = "B" },
                new CreateNotificationDto { UserId = 2, Type = NotificationType.ApprovalReviewed, Title = "C", Message = "D" }
            });

            _notificationRepo.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Exactly(2));
            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateManyAsync_EmptyList_DoesNotSave()
        {
            await _sut.CreateManyAsync(Enumerable.Empty<CreateNotificationDto>());

            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task CreateManyAsync_AllInvalidUserIds_DoesNotSave()
        {
            await _sut.CreateManyAsync(new[]
            {
                new CreateNotificationDto { UserId = 0 },
                new CreateNotificationDto { UserId = -1 }
            });

            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        // ── GetMyNotifications ────────────────────────────────────────────────

        [Fact]
        public async Task GetMyNotificationsAsync_ReturnsUserNotifications()
        {
            var notifications = new[]
            {
                new Notification { Id = 1, UserId = 1, Type = NotificationType.TaskAssigned, Title = "T", Message = "M", CreatedAt = DateTime.UtcNow }
            };
            _notificationRepo.Setup(r => r.GetByUserIdAsync(1, It.IsAny<int>())).ReturnsAsync(notifications);

            var result = await _sut.GetMyNotificationsAsync(1);

            result.Should().HaveCount(1);
            result.First().Id.Should().Be(1);
        }

        // ── GetUnreadCount ────────────────────────────────────────────────────

        [Fact]
        public async Task GetUnreadCountAsync_ReturnsCorrectCount()
        {
            _notificationRepo.Setup(r => r.GetUnreadCountAsync(1)).ReturnsAsync(5);

            var result = await _sut.GetUnreadCountAsync(1);

            result.Should().Be(5);
        }

        // ── MarkAsRead ────────────────────────────────────────────────────────

        [Fact]
        public async Task MarkAsReadAsync_UnreadNotification_MarksItAndReturnsTrue()
        {
            var notification = new Notification { Id = 1, UserId = 1, IsRead = false };
            _notificationRepo.Setup(r => r.GetByIdForUserAsync(1, 1)).ReturnsAsync(notification);
            _notificationRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.MarkAsReadAsync(1, 1);

            result.Should().BeTrue();
            notification.IsRead.Should().BeTrue();
        }

        [Fact]
        public async Task MarkAsReadAsync_AlreadyReadNotification_ReturnsTrueWithoutSaving()
        {
            var notification = new Notification { Id = 1, UserId = 1, IsRead = true };
            _notificationRepo.Setup(r => r.GetByIdForUserAsync(1, 1)).ReturnsAsync(notification);

            var result = await _sut.MarkAsReadAsync(1, 1);

            result.Should().BeTrue();
            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task MarkAsReadAsync_NotificationNotFound_ReturnsFalse()
        {
            _notificationRepo.Setup(r => r.GetByIdForUserAsync(99, 1)).ReturnsAsync((Notification?)null);

            var result = await _sut.MarkAsReadAsync(99, 1);

            result.Should().BeFalse();
        }

        // ── MarkAllAsRead ─────────────────────────────────────────────────────

        [Fact]
        public async Task MarkAllAsReadAsync_MarksAllUnreadForUser()
        {
            var notifications = new[]
            {
                new Notification { Id = 1, UserId = 1, IsRead = false },
                new Notification { Id = 2, UserId = 1, IsRead = false }
            };
            _notificationRepo.Setup(r => r.GetUnreadByUserIdAsync(1)).ReturnsAsync(notifications);
            _notificationRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await _sut.MarkAllAsReadAsync(1);

            notifications.All(n => n.IsRead).Should().BeTrue();
            _notificationRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }
    }
}
