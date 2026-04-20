using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Domain.Interfaces
{
    public interface ITaskApprovalRepository : IGenericRepository<TaskApproval>
    {
        Task<IEnumerable<TaskApproval>> GetPendingApprovalsAsync();
        Task<IEnumerable<TaskApproval>> GetApprovalsByTaskIdAsync(int taskId);
        Task<IEnumerable<TaskApproval>> GetPendingApprovalsForApproverAsync(int approverUserId);
    }
}