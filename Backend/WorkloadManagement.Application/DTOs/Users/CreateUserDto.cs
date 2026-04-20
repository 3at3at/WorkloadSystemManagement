namespace WorkloadManagement.Application.DTOs.Users
{
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public int? TeamLeaderId { get; set; }
    }
}