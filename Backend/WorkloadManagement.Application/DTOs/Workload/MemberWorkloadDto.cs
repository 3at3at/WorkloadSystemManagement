namespace WorkloadManagement.Application.DTOs.Workload
{
    public class MemberWorkloadDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public decimal TotalWeight { get; set; }
        public int TaskCount { get; set; }
        public string WorkloadStatus { get; set; } = string.Empty;

        public int? TeamLeaderId { get; set; }
        public string? TeamLeaderName { get; set; }
    }
}