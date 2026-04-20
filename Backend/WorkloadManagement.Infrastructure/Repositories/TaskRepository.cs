using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;
using TaskStatusEnum = WorkloadManagement.Domain.Enums.TaskStatus;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class TaskRepository : GenericRepository<TaskItem>, ITaskRepository
    {
        public TaskRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<IEnumerable<TaskItem>> GetAllAsync()
        {
            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .ToListAsync();
        }

        public override async Task<TaskItem?> GetByIdAsync(int id)
        {
            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Include(t => t.Acknowledgements)
                .Include(t => t.Approvals)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByUserIdAsync(int userId)
        {
            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Where(t => t.AssignedToUserId == userId)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByWeekAsync(int weekNumber, int year)
        {
            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Where(t => t.WeekNumber == weekNumber && t.Year == year)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByUserAndWeekAsync(int userId, int weekNumber, int year)
        {
            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Where(t => t.AssignedToUserId == userId && t.WeekNumber == weekNumber && t.Year == year)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByStatusAsync(string status)
        {
            if (!Enum.TryParse<TaskStatusEnum>(status, true, out var parsedStatus))
                return new List<TaskItem>();

            return await _context.Tasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.CreatedByUser)
                .Where(t => t.Status == parsedStatus)
                .ToListAsync();
        }
    }
}