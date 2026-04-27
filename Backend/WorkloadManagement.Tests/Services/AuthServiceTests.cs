using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Auth;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;

namespace WorkloadManagement.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<IRoleRepository> _roleRepo = new();
        private readonly Mock<IPasswordHasher> _hasher = new();
        private readonly Mock<IJwtTokenGenerator> _jwtGenerator = new();
        private readonly AuthService _sut;

        public AuthServiceTests()
        {
            _sut = new AuthService(_userRepo.Object, _roleRepo.Object, _hasher.Object, _jwtGenerator.Object);
        }

        // ── Register ──────────────────────────────────────────────────────────

        [Fact]
        public async Task RegisterAsync_WithNewEmail_ReturnsTokenAndUserData()
        {
            var role = EntityFactory.AdminRole();
            _userRepo.Setup(r => r.GetByEmailAsync("new@test.com")).ReturnsAsync((User?)null);
            _roleRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(role);
            _hasher.Setup(h => h.HashPassword("pass123")).Returns("hashed");
            _jwtGenerator.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt-token");
            _userRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
            _userRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.RegisterAsync(new RegisterRequestDto
            {
                FullName = "New User",
                Email = "new@test.com",
                Password = "pass123",
                RoleId = 1
            });

            result.Token.Should().Be("jwt-token");
            result.Email.Should().Be("new@test.com");
            result.Role.Should().Be("Admin");
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync("exists@test.com")).ReturnsAsync(EntityFactory.AdminUser());

            var act = () => _sut.RegisterAsync(new RegisterRequestDto
            {
                Email = "exists@test.com",
                Password = "pass",
                RoleId = 1
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*already exists*");
        }

        [Fact]
        public async Task RegisterAsync_WithInvalidRole_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            _roleRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Role?)null);

            var act = () => _sut.RegisterAsync(new RegisterRequestDto
            {
                Email = "new@test.com",
                Password = "pass",
                RoleId = 99
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*Invalid role*");
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ReturnsToken()
        {
            var user = EntityFactory.AdminUser();
            _userRepo.Setup(r => r.GetByEmailAsync("admin1@test.com")).ReturnsAsync(user);
            _hasher.Setup(h => h.VerifyPassword("pass123", "hashed")).Returns(true);
            _jwtGenerator.Setup(j => j.GenerateToken(user)).Returns("jwt-token");

            var result = await _sut.LoginAsync(new LoginRequestDto
            {
                Email = "admin1@test.com",
                Password = "pass123"
            });

            result.Token.Should().Be("jwt-token");
            result.Id.Should().Be(user.Id);
        }

        [Fact]
        public async Task LoginAsync_WithWrongPassword_Throws()
        {
            var user = EntityFactory.AdminUser();
            _userRepo.Setup(r => r.GetByEmailAsync("admin1@test.com")).ReturnsAsync(user);
            _hasher.Setup(h => h.VerifyPassword("wrong", "hashed")).Returns(false);

            var act = () => _sut.LoginAsync(new LoginRequestDto
            {
                Email = "admin1@test.com",
                Password = "wrong"
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*Invalid email or password*");
        }

        [Fact]
        public async Task LoginAsync_WithUnknownEmail_Throws()
        {
            _userRepo.Setup(r => r.GetByEmailAsync("ghost@test.com")).ReturnsAsync((User?)null);

            var act = () => _sut.LoginAsync(new LoginRequestDto
            {
                Email = "ghost@test.com",
                Password = "pass"
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*Invalid email or password*");
        }

        [Fact]
        public async Task LoginAsync_WithInactiveUser_Throws()
        {
            var user = EntityFactory.AdminUser();
            user.IsActive = false;
            _userRepo.Setup(r => r.GetByEmailAsync("admin1@test.com")).ReturnsAsync(user);
            _hasher.Setup(h => h.VerifyPassword("pass123", "hashed")).Returns(true);

            var act = () => _sut.LoginAsync(new LoginRequestDto
            {
                Email = "admin1@test.com",
                Password = "pass123"
            });

            await act.Should().ThrowAsync<Exception>().WithMessage("*inactive*");
        }
    }
}
