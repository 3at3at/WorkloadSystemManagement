using WorkloadManagement.Domain.Entities;

namespace WorkloadManagement.Domain.Interfaces
{
    public interface ITaskAcknowledgementRepository : IGenericRepository<TaskAcknowledgement>
    {
        Task<TaskAcknowledgement?> GetByTaskAndMemberAsync(int taskId, int memberId);
        Task<IEnumerable<TaskAcknowledgement>> GetByMemberIdAsync(int memberId);
    }
}