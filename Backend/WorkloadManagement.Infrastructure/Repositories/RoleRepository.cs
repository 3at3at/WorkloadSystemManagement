using Microsoft.EntityFrameworkCore;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Infrastructure.Data;

namespace WorkloadManagement.Infrastructure.Repositories
{
    public class RoleRepository : GenericRepository<Role>, IRoleRepository
    {
        public RoleRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Role?> GetByNameAsync(string roleName)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.Name.ToString() == roleName);
        }
    }
}