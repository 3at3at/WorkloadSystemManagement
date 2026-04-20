using WorkloadManagement.Application.DTOs.Dashboard;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly ITaskApprovalRepository _taskApprovalRepository;
        private readonly IWorkloadService _workloadService;

        public DashboardService(
            IUserRepository userRepository,
            ITaskRepository taskRepository,
            ITaskApprovalRepository taskApprovalRepository,
            IWorkloadService workloadService)
        {
            _userRepository = userRepository;
            _taskRepository = taskRepository;
            _taskApprovalRepository = taskApprovalRepository;
            _workloadService = workloadService;
        }

        public async Task<AdminDashboardSummaryDto> GetAdminSummaryAsync(int currentUserId, int weekNumber, int year)
        {
            var users = await _userRepository.GetAllAsync();
            var tasks = await _taskRepository.GetAllAsync();

            // FIX: only approvals assigned to this admin
            var approvals = await _taskApprovalRepository.GetPendingApprovalsForApproverAsync(currentUserId);

            var workload = await _workloadService.GetWeeklyTeamWorkloadAsync(currentUserId, "Admin", weekNumber, year);

            var filteredUsers = users.Where(u => u.Id != currentUserId);

            return new AdminDashboardSummaryDto
            {
                TotalUsers = filteredUsers.Count(),
                PendingApprovals = approvals.Count(),
                TotalTasks = tasks.Count(),
                OverloadedMembers = workload.OverloadedCount
            };
        }

        public async Task<LeaderDashboardSummaryDto> GetLeaderSummaryAsync(int leaderId, int weekNumber, int year)
        {
            var users = await _userRepository.GetAllAsync();
            var tasks = await _taskRepository.GetAllAsync();
            var approvals = await _taskApprovalRepository.GetPendingApprovalsForApproverAsync(leaderId);
            var workload = await _workloadService.GetWeeklyTeamWorkloadAsync(leaderId, "TeamLeader", weekNumber, year);

            var ownMembers = users
                .Where(u => u.TeamLeaderId == leaderId)
                .Select(u => u.FullName)
                .ToHashSet();

            var teamTasks = tasks.Where(t =>
                t.AssignedToUserId == leaderId ||
                t.CreatedByUserId == leaderId ||
                (t.AssignedToUser != null && ownMembers.Contains(t.AssignedToUser.FullName))
            );

            return new LeaderDashboardSummaryDto
            {
                AssignedTasks = teamTasks.Count(),
                PendingApprovals = approvals.Count(),
                BalancedMembers = workload.BalancedCount,
                OverloadedMembers = workload.OverloadedCount
            };
        }

        public async Task<MemberDashboardSummaryDto> GetMemberSummaryAsync(int memberId, int weekNumber, int year)
        {
            var tasks = await _taskRepository.GetTasksByUserIdAsync(memberId);
            var workload = await _workloadService.GetMemberWeeklyWorkloadAsync(memberId, weekNumber, year);

            return new MemberDashboardSummaryDto
            {
                MyTasks = tasks.Count(),
                NewTasks = tasks.Count(t => t.Status.ToString() == "New"),
                WeeklyWorkload = workload?.TotalWeight ?? 0,
                WorkloadStatus = workload?.WorkloadStatus ?? "N/A"
            };
        }
    }
}