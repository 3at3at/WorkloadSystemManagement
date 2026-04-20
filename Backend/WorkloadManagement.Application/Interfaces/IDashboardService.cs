using WorkloadManagement.Application.DTOs.Dashboard;

namespace WorkloadManagement.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<AdminDashboardSummaryDto> GetAdminSummaryAsync(int currentUserId, int weekNumber, int year);
        Task<LeaderDashboardSummaryDto> GetLeaderSummaryAsync(int leaderId, int weekNumber, int year);
        Task<MemberDashboardSummaryDto> GetMemberSummaryAsync(int memberId, int weekNumber, int year);
    }
}