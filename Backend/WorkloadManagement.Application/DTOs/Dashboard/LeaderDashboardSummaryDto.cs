namespace WorkloadManagement.Application.DTOs.Dashboard
{
    public class LeaderDashboardSummaryDto
    {
        public int AssignedTasks { get; set; }
        public int PendingApprovals { get; set; }
        public int BalancedMembers { get; set; }
        public int OverloadedMembers { get; set; }
    }
}