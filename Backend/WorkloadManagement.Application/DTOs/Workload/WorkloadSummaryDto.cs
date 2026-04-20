namespace WorkloadManagement.Application.DTOs.Workload
{
    public class WorkloadSummaryDto
    {
        public IEnumerable<MemberWorkloadDto> Members { get; set; } = new List<MemberWorkloadDto>();
        public int OverloadedCount { get; set; }
        public int AvailableCount { get; set; }
        public int BalancedCount { get; set; }
    }
}