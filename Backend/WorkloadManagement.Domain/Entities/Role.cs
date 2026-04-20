using WorkloadManagement.Domain.Enums;

namespace WorkloadManagement.Domain.Entities
{
    public class Role
    {
        public int Id { get; set; }
        public RoleType Name { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}