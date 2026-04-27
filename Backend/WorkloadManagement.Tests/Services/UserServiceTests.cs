using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Users;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;

namespace WorkloadManagement.Tests.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<IRoleRepository> _roleRepo = new();
        private readonly Mock<IPasswordHasher> _hasher = new();
        private readonly UserService _sut;

        public UserServiceTests()
        {
            _sut = new UserService(_userRepo.Object, _roleRepo.Object, _hasher.Object);
        }

        // ── GetAllUsers ───────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllUsersAsync_ReturnsAllUsers()
        {
            _userRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(
                new[] { EntityFactory.AdminUser(), EntityFactory.LeaderUser() });

            var result = await _sut.GetAllUsersAsync();

            result.Should().HaveCount(2);
        }

        // ── GetById ───────────────────────────────────────────────────────────

        [Fact]
        public async Task GetByIdAsync_ExistingUser_ReturnsUserDto()
        {
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(EntityFactory.AdminUser());

            var result = await _sut.GetByIdAsync(1);

            result.Should().NotBeNull();
            result!.Id.Should().Be(1);
            result.Role.Should().Be("Admin");
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingUser_ReturnsNull()
        {
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

            var result = await _sut.GetByIdAsync(99);

            result.Should().BeNull();
        }

        // ── CreateUser ────────────────────────────────────────────────────────

        [Fact]
        public async Task CreateUserAsync_NewMemberWithValidLeader_CreatesUser()
        {
            var leader = EntityFactory.LeaderUser();
            var memberRole = EntityFactory.MemberRole();

            _userRepo.Setup(r => r.GetByEmailAsync("m@test.com")).ReturnsAsync((User?)null);
            _roleRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(memberRole);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(leader);
            _hasher.Setup(h => h.HashPassword("pass")).Returns("hashed");
            _userRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
            _userRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.CreateUserAsync(new CreateUserDto
            {
                FullName = "New Member",
                Email = "m@test.com",
                Password = "pass",
                RoleId = 3,
                TeamLeaderId = 2
            });

            result.Email.Should().Be("m@test.com");
            result.Role.Should().Be("Member");
            result.TeamLeaderId.Should().Be(2);
        }

        [Fact]
        public async Task CreateUserAsync_DuplicateEmail_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync("dup@test.com")).ReturnsAsync(EntityFactory.AdminUser());

            var act = () => _sut.CreateUserAsync(new CreateUserDto
            {
                Email = "dup@test.com",
                Password = "pass",
                RoleId = 1
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*already exists*");
        }

        [Fact]
        public async Task CreateUserAsync_MemberWithoutTeamLeader_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _roleRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(EntityFactory.MemberRole());

            var act = () => _sut.CreateUserAsync(new CreateUserDto
            {
                Email = "m@test.com",
                Password = "pass",
                RoleId = 3,
                TeamLeaderId = null
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*team leader*");
        }

        [Fact]
        public async Task CreateUserAsync_MemberWithInvalidLeader_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _roleRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(EntityFactory.MemberRole());
            // Return a user whose role is NOT TeamLeader
            _userRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(EntityFactory.AdminUser(5));

            var act = () => _sut.CreateUserAsync(new CreateUserDto
            {
                Email = "m@test.com",
                Password = "pass",
                RoleId = 3,
                TeamLeaderId = 5
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*Invalid team leader*");
        }

        // ── DeleteUser ────────────────────────────────────────────────────────

        [Fact]
        public async Task DeleteUserAsync_ExistingUser_ReturnsTrue()
        {
            var user = EntityFactory.MemberUser();
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.DeleteUserAsync(3, currentUserId: 1);

            result.Should().BeTrue();
            _userRepo.Verify(r => r.Delete(user), Times.Once);
        }

        [Fact]
        public async Task DeleteUserAsync_OwnAccount_Throws()
        {
            var act = () => _sut.DeleteUserAsync(id: 1, currentUserId: 1);

            await act.Should().ThrowAsync<Exception>().WithMessage("*cannot delete your own*");
        }

        [Fact]
        public async Task DeleteUserAsync_NonExistingUser_ReturnsFalse()
        {
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

            var result = await _sut.DeleteUserAsync(99, currentUserId: 1);

            result.Should().BeFalse();
        }

        // ── UpdateUserStatus ──────────────────────────────────────────────────

        [Fact]
        public async Task UpdateUserStatusAsync_ExistingUser_UpdatesAndReturnsTrue()
        {
            var user = EntityFactory.AdminUser();
            user.IsActive = true;
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.UpdateUserStatusAsync(1, isActive: false);

            result.Should().BeTrue();
            user.IsActive.Should().BeFalse();
        }

        [Fact]
        public async Task UpdateUserStatusAsync_NonExistingUser_ReturnsFalse()
        {
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);

            var result = await _sut.UpdateUserStatusAsync(99, isActive: true);

            result.Should().BeFalse();
        }
    }
}
