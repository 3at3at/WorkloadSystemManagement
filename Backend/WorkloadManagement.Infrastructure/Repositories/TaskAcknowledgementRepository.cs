using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class TaskAcknowledgementRepository : GenericRepository<TaskAcknowledgement>, ITaskAcknowledgementRepository
    {
        public TaskAcknowledgementRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<TaskAcknowledgement?> GetByTaskAndMemberAsync(int taskId, int memberId)
        {
            return await _context.TaskAcknowledgements
                .Include(x => x.TaskItem)
                .Include(x => x.Member)
                .FirstOrDefaultAsync(x => x.TaskItemId == taskId && x.MemberId == memberId);
        }

        public async Task<IEnumerable<TaskAcknowledgement>> GetByMemberIdAsync(int memberId)
        {
            return await _context.TaskAcknowledgements
                .Include(x => x.TaskItem)
                .Include(x => x.Member)
                .Where(x => x.MemberId == memberId)
                .ToListAsync();
        }
    }
}