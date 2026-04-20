using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}