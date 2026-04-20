namespace WorkloadManagement.Application.DTOs.Users
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int? TeamLeaderId { get; set; }
        public string? TeamLeaderName { get; set; }
    }
}