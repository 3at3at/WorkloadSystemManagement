using WorkloadManagement.Application.DTOs.Users;

namespace WorkloadManagement.Application.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetByIdAsync(int id);
        Task<UserDto?> GetCurrentUserAsync(int userId);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto dto, int currentUserId);
        Task<bool> DeleteUserAsync(int id, int currentUserId);
        Task<bool> UpdateUserStatusAsync(int id, bool isActive);
    }
}