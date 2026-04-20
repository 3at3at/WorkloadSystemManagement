using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class TaskApprovalRepository : GenericRepository<TaskApproval>, ITaskApprovalRepository
    {
        public TaskApprovalRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<TaskApproval?> GetByIdAsync(int id)
        {
            return await _context.TaskApprovals
                .Include(x => x.TaskItem)
                .Include(x => x.RequestedByUser)
                .Include(x => x.TargetApproverUser)
                .Include(x => x.ApprovedByUser)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public override async Task<IEnumerable<TaskApproval>> GetAllAsync()
        {
            return await _context.TaskApprovals
                .Include(x => x.TaskItem)
                .Include(x => x.RequestedByUser)
                .Include(x => x.TargetApproverUser)
                .Include(x => x.ApprovedByUser)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskApproval>> GetPendingApprovalsAsync()
        {
            return await _context.TaskApprovals
                .Include(x => x.TaskItem)
                .Include(x => x.RequestedByUser)
                .Include(x => x.TargetApproverUser)
                .Include(x => x.ApprovedByUser)
                .Where(x => x.ApprovalStatus == ApprovalStatus.Pending)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskApproval>> GetApprovalsByTaskIdAsync(int taskId)
        {
            return await _context.TaskApprovals
                .Include(x => x.TaskItem)
                .Include(x => x.RequestedByUser)
                .Include(x => x.TargetApproverUser)
                .Include(x => x.ApprovedByUser)
                .Where(x => x.TaskItemId == taskId)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskApproval>> GetPendingApprovalsForApproverAsync(int approverUserId)
{
    return await _context.TaskApprovals
        .Include(x => x.TaskItem)
        .Include(x => x.RequestedByUser)
        .Include(x => x.TargetApproverUser)
        .Include(x => x.ApprovedByUser)
        .Where(x => x.ApprovalStatus == ApprovalStatus.Pending &&
                    x.TargetApproverUserId == approverUserId)
        .ToListAsync();
}


    }
}