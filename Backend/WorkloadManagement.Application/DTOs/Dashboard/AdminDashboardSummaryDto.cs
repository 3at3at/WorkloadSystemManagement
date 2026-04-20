namespace WorkloadManagement.Application.DTOs.Dashboard
{
    public class AdminDashboardSummaryDto
    {
        public int TotalUsers { get; set; }
        public int PendingApprovals { get; set; }
        public int TotalTasks { get; set; }
        public int OverloadedMembers { get; set; }
    }
}