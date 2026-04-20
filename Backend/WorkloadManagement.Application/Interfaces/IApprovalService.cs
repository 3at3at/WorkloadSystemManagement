using WorkloadManagement.Application.DTOs.Approvals;

namespace WorkloadManagement.Application.Interfaces
{
    public interface IApprovalService
    {
        Task<TaskApprovalDto> CreateApprovalRequestAsync(CreateApprovalRequestDto dto, int requestedByUserId);
        Task<IEnumerable<TaskApprovalDto>> GetPendingApprovalsAsync();
        Task<IEnumerable<TaskApprovalDto>> GetApprovalsByTaskIdAsync(int taskId);
        Task<TaskApprovalDto?> ReviewApprovalAsync(int approvalId, bool approve, int approvedByUserId);
        Task<IEnumerable<TaskApprovalDto>> GetMyPendingApprovalsAsync(int approverUserId);
    }
}