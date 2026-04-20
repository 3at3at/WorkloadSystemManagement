using WorkloadManagement.Application.DTOs.Users;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IPasswordHasher _passwordHasher;

        public UserService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _passwordHasher = passwordHasher;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();

            return users.Select(MapToUserDto);
        }

        public async Task<UserDto?> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
                throw new Exception("Email already exists.");

            var role = await _roleRepository.GetByIdAsync(dto.RoleId);
            if (role == null)
                throw new Exception("Invalid role.");

            User? teamLeader = null;

            if (dto.RoleId == 3)
            {
                if (!dto.TeamLeaderId.HasValue)
                    throw new Exception("A member must be assigned to a team leader.");

                teamLeader = await _userRepository.GetByIdAsync(dto.TeamLeaderId.Value);

                if (teamLeader == null || teamLeader.Role == null || teamLeader.Role.Name != RoleType.TeamLeader)
                    throw new Exception("Invalid team leader.");
            }
            else
            {
                dto.TeamLeaderId = null;
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                RoleId = dto.RoleId,
                IsActive = true,
                TeamLeaderId = dto.TeamLeaderId
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            user.Role = role;
            user.TeamLeader = teamLeader;

            return MapToUserDto(user);
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto dto, int currentUserId)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return null;

            var existingByEmail = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingByEmail != null && existingByEmail.Id != id)
                throw new Exception("Email already exists.");

            var role = await _roleRepository.GetByIdAsync(dto.RoleId);
            if (role == null)
                throw new Exception("Invalid role.");

            User? teamLeader = null;

            if (dto.RoleId == 3)
            {
                if (!dto.TeamLeaderId.HasValue)
                    throw new Exception("A member must be assigned to a team leader.");

                teamLeader = await _userRepository.GetByIdAsync(dto.TeamLeaderId.Value);

                if (teamLeader == null || teamLeader.Role == null || teamLeader.Role.Name != RoleType.TeamLeader)
                    throw new Exception("Invalid team leader.");
            }
            else
            {
                dto.TeamLeaderId = null;
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.RoleId = dto.RoleId;
            user.TeamLeaderId = dto.TeamLeaderId;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = _passwordHasher.HashPassword(dto.Password);
            }

            user.Role = role;
            user.TeamLeader = teamLeader;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return MapToUserDto(user);
        }

        public async Task<bool> DeleteUserAsync(int id, int currentUserId)
        {
            if (id == currentUserId)
                throw new Exception("You cannot delete your own account.");

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return false;

            // If your repository uses Remove instead of Delete, replace the next line only.
            _userRepository.Delete(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateUserStatusAsync(int id, bool isActive)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return false;

            user.IsActive = isActive;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return true;
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name.ToString() ?? string.Empty,
                IsActive = user.IsActive,
                TeamLeaderId = user.TeamLeaderId,
                TeamLeaderName = user.TeamLeader?.FullName
            };
        }
    }
}