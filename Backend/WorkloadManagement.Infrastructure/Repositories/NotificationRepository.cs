using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<IEnumerable<Notification>> GetAllAsync()
        {
            return await _context.Set<Notification>()
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public override async Task<Notification?> GetByIdAsync(int id)
        {
            return await _context.Set<Notification>()
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, int take = 50)
        {
            return await _context.Set<Notification>()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Set<Notification>()
                .CountAsync(x => x.UserId == userId && !x.IsRead);
        }

        public async Task<Notification?> GetByIdForUserAsync(int id, int userId)
        {
            return await _context.Set<Notification>()
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        }

        public async Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId)
        {
            return await _context.Set<Notification>()
                .Where(x => x.UserId == userId && !x.IsRead)
                .ToListAsync();
        }
    }
}
