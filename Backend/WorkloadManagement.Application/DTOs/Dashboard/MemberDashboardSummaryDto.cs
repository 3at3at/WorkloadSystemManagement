namespace WorkloadManagement.Application.DTOs.Dashboard
{
    public class MemberDashboardSummaryDto
    {
        public int MyTasks { get; set; }
        public int NewTasks { get; set; }
        public decimal WeeklyWorkload { get; set; }
        public string WorkloadStatus { get; set; } = string.Empty;
    }
}