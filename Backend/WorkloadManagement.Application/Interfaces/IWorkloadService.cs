using WorkloadManagement.Application.DTOs.Workload;

namespace WorkloadManagement.Application.Interfaces
{
    public interface IWorkloadService
    {
        Task<TaskAcknowledgementDto> AcknowledgeTaskAsync(int taskId, int memberId);
        Task<MemberWorkloadDto?> GetMemberWeeklyWorkloadAsync(int userId, int weekNumber, int year);
        Task<WorkloadSummaryDto> GetWeeklyTeamWorkloadAsync(int requesterId, string requesterRole, int weekNumber, int year);
    }
}