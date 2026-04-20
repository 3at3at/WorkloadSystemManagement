using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Domain.Interfaces
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetMembersAsync();
        Task<IEnumerable<User>> GetLeadersAsync();
        Task<IEnumerable<User>> GetMembersByTeamLeaderIdAsync(int teamLeaderId);
    }
}