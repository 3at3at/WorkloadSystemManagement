using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(x => x.Role)
                .Include(x => x.TeamLeader)
                .ToListAsync();
        }

        public override async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(x => x.Role)
                .Include(x => x.TeamLeader)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(x => x.Role)
                .Include(x => x.TeamLeader)
                .FirstOrDefaultAsync(x => x.Email == email);
        }

        public async Task<IEnumerable<User>> GetMembersAsync()
        {
            return await _context.Users
                .Include(x => x.Role)
                .Include(x => x.TeamLeader)
                .Where(x => x.Role != null && x.Role.Name == RoleType.Member)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetLeadersAsync()
        {
            return await _context.Users
                .Include(x => x.Role)
                .Where(x => x.Role != null && x.Role.Name == RoleType.TeamLeader)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetMembersByTeamLeaderIdAsync(int teamLeaderId)
        {
            return await _context.Users
                .Include(x => x.Role)
                .Include(x => x.TeamLeader)
                .Where(x => x.Role != null &&
                            x.Role.Name == RoleType.Member &&
                            x.TeamLeaderId == teamLeaderId)
                .ToListAsync();
        }
    }
}