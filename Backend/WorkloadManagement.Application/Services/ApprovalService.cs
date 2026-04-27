using WorkloadManagement.Application.DTOs.Approvals;
using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Application.Services
{
    public class ApprovalService : IApprovalService
    {
        private readonly ITaskApprovalRepository _taskApprovalRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;

        public ApprovalService(
            ITaskApprovalRepository taskApprovalRepository,
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            INotificationService notificationService)
        {
            _taskApprovalRepository = taskApprovalRepository;
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        public async Task<TaskApprovalDto> CreateApprovalRequestAsync(CreateApprovalRequestDto dto, int requestedByUserId)
        {
            var requestReason = (dto.RequestReason ?? dto.Reason ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(requestReason))
                throw new Exception("Approval reason is required.");

            var task = await _taskRepository.GetByIdAsync(dto.TaskId);
            if (task == null)
                throw new Exception("Task not found.");

            var requestedByUser = await _userRepository.GetByIdAsync(requestedByUserId);
            if (requestedByUser == null)
                throw new Exception("Requesting user not found.");

            var targetApprover = await _userRepository.GetByIdAsync(dto.TargetApproverUserId);
            if (targetApprover == null)
                throw new Exception("Target approver not found.");

            ValidateApprovalHierarchy(requestedByUser, targetApprover, task);

            var approval = new TaskApproval
            {
                TaskItemId = dto.TaskId,
                RequestedByUserId = requestedByUserId,
                TargetApproverUserId = dto.TargetApproverUserId,
                ApprovalStatus = ApprovalStatus.Pending,
                RequestReason = requestReason,
                RequestedAt = DateTime.UtcNow
            };

            await _taskApprovalRepository.AddAsync(approval);

            task.IsMajorChangePendingApproval = true;
            // Null out navigation properties before Update to prevent EF Core tracking
            // conflicts caused by the global NoTracking context attaching duplicate instances.
            task.AssignedToUser = null!;
            task.CreatedByUser = null!;
            task.Acknowledgements = null!;
            task.Approvals = null!;
            _taskRepository.Update(task);

            await _taskApprovalRepository.SaveChangesAsync();

            // Collect all notifications to batch them together
            var notificationsToCreate = new List<CreateNotificationDto>();

            if (targetApprover.Id != requestedByUserId)
            {
                notificationsToCreate.Add(new CreateNotificationDto
                {
                    UserId = targetApprover.Id,
                    Type = NotificationType.ApprovalSubmitted,
                    Title = "New approval request",
                    Message = $"{requestedByUser.FullName} requested approval for \"{task.Title}\".",
                    RelatedEntityId = approval.Id,
                    ActionUrl = GetApprovalsPathForRole(targetApprover.Role?.Name)
                });
            }

            // Notify team leader if requester is a member
            if (requestedByUser?.Role?.Name == RoleType.Member && requestedByUser?.TeamLeaderId.HasValue == true)
            {
                var teamLeader = await _userRepository.GetByIdAsync(requestedByUser.TeamLeaderId.Value);
                if (teamLeader != null && teamLeader.Id != targetApprover.Id)
                {
                    notificationsToCreate.Add(new CreateNotificationDto
                    {
                        UserId = teamLeader.Id,
                        Type = NotificationType.ApprovalSubmitted,
                        Title = "Team member approval request",
                        Message = $"{requestedByUser.FullName} requested approval for \"{task.Title}\".",
                        RelatedEntityId = approval.Id,
                        ActionUrl = GetApprovalsPathForRole(teamLeader.Role?.Name)
                    });
                }
            }

            // Send all notifications in a batch
            if (notificationsToCreate.Count > 0)
            {
                await _notificationService.CreateManyAsync(notificationsToCreate);
            }

            // Build DTO from local variables (navigation props on approval are not set
            // to avoid re-introducing tracking conflicts on the second SaveChanges).
            return new TaskApprovalDto
            {
                Id = approval.Id,
                TaskId = approval.TaskItemId,
                TaskTitle = task.Title,
                RequestedByUserId = approval.RequestedByUserId,
                RequestedBy = requestedByUser.FullName,
                TargetApproverUserId = approval.TargetApproverUserId,
                TargetApprover = targetApprover.FullName,
                ApprovedByUserId = approval.ApprovedByUserId,
                ApprovedBy = string.Empty,
                ApprovalStatus = approval.ApprovalStatus.ToString(),
                RequestReason = approval.RequestReason,
                RequestedAt = DateTime.SpecifyKind(approval.RequestedAt, DateTimeKind.Utc),
                ApprovedAt = null
            };
        }

        public async Task<IEnumerable<TaskApprovalDto>> GetPendingApprovalsAsync()
        {
            var approvals = await _taskApprovalRepository.GetPendingApprovalsAsync();
            return approvals.Select(MapToDto);
        }

        public async Task<IEnumerable<TaskApprovalDto>> GetMyPendingApprovalsAsync(int approverUserId)
        {
            var approvals = await _taskApprovalRepository.GetPendingApprovalsForApproverAsync(approverUserId);
            return approvals.Select(MapToDto);
        }

        public async Task<IEnumerable<TaskApprovalDto>> GetApprovalsByTaskIdAsync(int taskId)
        {
            var approvals = await _taskApprovalRepository.GetApprovalsByTaskIdAsync(taskId);
            return approvals.Select(MapToDto);
        }

        public async Task<TaskApprovalDto?> ReviewApprovalAsync(int approvalId, bool approve, int approvedByUserId)
        {
            var approval = await _taskApprovalRepository.GetByIdAsync(approvalId);
            if (approval == null)
                return null;

            if (approval.ApprovalStatus != ApprovalStatus.Pending)
                throw new Exception("This approval request has already been reviewed.");

            if (approval.TargetApproverUserId != approvedByUserId)
                throw new Exception("You are not the assigned approver for this request.");

            var approvedByUser = await _userRepository.GetByIdAsync(approvedByUserId);
            if (approvedByUser == null)
                throw new Exception("Approving user not found.");

            // Load task and requester if not already loaded
            if (approval.TaskItem == null)
                approval.TaskItem = await _taskRepository.GetByIdAsync(approval.TaskItemId);
            if (approval.RequestedByUser == null)
                approval.RequestedByUser = await _userRepository.GetByIdAsync(approval.RequestedByUserId);

            // Capture navigation data before clearing references to avoid EF tracking conflicts.
            var taskTitle = approval.TaskItem?.Title ?? string.Empty;
            var requestedByUserRef = approval.RequestedByUser;
            var targetApproverRef = approval.TargetApproverUser;

            approval.ApprovalStatus = approve ? ApprovalStatus.Approved : ApprovalStatus.Rejected;
            approval.ApprovedByUserId = approvedByUserId;
            approval.ApprovedAt = DateTime.UtcNow;

            if (approval.TaskItem != null)
            {
                approval.TaskItem.IsMajorChangePendingApproval = false;
                // Null out navigation properties before Update to prevent tracking conflicts.
                approval.TaskItem.AssignedToUser = null!;
                approval.TaskItem.CreatedByUser = null!;
                approval.TaskItem.Acknowledgements = null!;
                approval.TaskItem.Approvals = null!;
                _taskRepository.Update(approval.TaskItem);
            }

            // Null out approval navigation properties before Update to prevent tracking
            // conflicts between entities loaded via different queries (NoTracking context).
            approval.TaskItem = null!;
            approval.RequestedByUser = null!;
            approval.TargetApproverUser = null!;
            approval.ApprovedByUser = null!;
            _taskApprovalRepository.Update(approval);
            await _taskApprovalRepository.SaveChangesAsync();

            // Collect all notifications to batch them together
            var notificationsToCreate = new List<CreateNotificationDto>();

            if (approval.RequestedByUserId != approvedByUserId && requestedByUserRef != null)
            {
                notificationsToCreate.Add(new CreateNotificationDto
                {
                    UserId = approval.RequestedByUserId,
                    Type = NotificationType.ApprovalReviewed,
                    Title = approve ? "Approval approved" : "Approval rejected",
                    Message = $"Your approval request for \"{taskTitle}\" was {(approve ? "approved" : "rejected")} by {approvedByUser.FullName}.",
                    RelatedEntityId = approval.Id,
                    ActionUrl = GetApprovalsPathForRole(requestedByUserRef.Role?.Name)
                });

                // Notify team leader if requester is a member
                if (requestedByUserRef.Role?.Name == RoleType.Member && requestedByUserRef.TeamLeaderId.HasValue)
                {
                    var teamLeader = await _userRepository.GetByIdAsync(requestedByUserRef.TeamLeaderId.Value);
                    if (teamLeader != null && teamLeader.Id != approvedByUserId)
                    {
                        notificationsToCreate.Add(new CreateNotificationDto
                        {
                            UserId = teamLeader.Id,
                            Type = NotificationType.ApprovalReviewed,
                            Title = approve ? "Team member approval approved" : "Team member approval rejected",
                            Message = $"{requestedByUserRef.FullName}'s approval request for \"{taskTitle}\" was {(approve ? "approved" : "rejected")} by {approvedByUser.FullName}.",
                            RelatedEntityId = approval.Id,
                            ActionUrl = GetApprovalsPathForRole(teamLeader.Role?.Name)
                        });
                    }
                }
            }

            // Send all notifications in a batch
            if (notificationsToCreate.Count > 0)
            {
                await _notificationService.CreateManyAsync(notificationsToCreate);
            }

            return new TaskApprovalDto
            {
                Id = approval.Id,
                TaskId = approval.TaskItemId,
                TaskTitle = taskTitle,
                RequestedByUserId = approval.RequestedByUserId,
                RequestedBy = requestedByUserRef?.FullName ?? string.Empty,
                TargetApproverUserId = approval.TargetApproverUserId,
                TargetApprover = targetApproverRef?.FullName ?? string.Empty,
                ApprovedByUserId = approval.ApprovedByUserId,
                ApprovedBy = approvedByUser.FullName,
                ApprovalStatus = approval.ApprovalStatus.ToString(),
                RequestReason = approval.RequestReason,
                RequestedAt = DateTime.SpecifyKind(approval.RequestedAt, DateTimeKind.Utc),
                ApprovedAt = approval.ApprovedAt.HasValue
                    ? DateTime.SpecifyKind(approval.ApprovedAt.Value, DateTimeKind.Utc)
                    : null
            };
        }

        private static void ValidateApprovalHierarchy(User requester, User targetApprover, TaskItem task)
        {
            var requesterRole = requester.Role?.Name;
            var targetRole = targetApprover.Role?.Name;

            if (requesterRole == RoleType.Member)
            {
                if (requester.TeamLeaderId == null)
                    throw new Exception("This member is not assigned to any team leader.");

                if (targetRole != RoleType.TeamLeader)
                    throw new Exception("A member can only send approval requests to a Team Leader.");

                if (targetApprover.Id != requester.TeamLeaderId.Value)
                    throw new Exception("A member can only send approval requests to their own team leader.");

                if (task.AssignedToUserId != requester.Id)
                    throw new Exception("A member can only request approval for their own assigned tasks.");
            }

            if (requesterRole == RoleType.TeamLeader)
            {
                if (targetRole != RoleType.Admin)
                    throw new Exception("A Team Leader can only send approval requests to an Admin.");

                var isOwnTask = task.AssignedToUserId == requester.Id;
                var isTaskCreatedByLeader = task.CreatedByUserId == requester.Id;

                if (!isOwnTask && !isTaskCreatedByLeader)
                    throw new Exception("A Team Leader can only request approval for tasks assigned to them or created by them.");
            }

            if (requesterRole == RoleType.Admin)
                throw new Exception("Admin does not need to request approval from another user.");
        }

        private static TaskApprovalDto MapToDto(TaskApproval approval)
        {
            return new TaskApprovalDto
            {
                Id = approval.Id,
                TaskId = approval.TaskItemId,
                TaskTitle = approval.TaskItem?.Title ?? string.Empty,
                RequestedByUserId = approval.RequestedByUserId,
                RequestedBy = approval.RequestedByUser?.FullName ?? string.Empty,
                TargetApproverUserId = approval.TargetApproverUserId,
                TargetApprover = approval.TargetApproverUser?.FullName ?? string.Empty,
                ApprovedByUserId = approval.ApprovedByUserId,
                ApprovedBy = approval.ApprovedByUser?.FullName ?? string.Empty,
                ApprovalStatus = approval.ApprovalStatus.ToString(),
                RequestReason = approval.RequestReason,
                RequestedAt = DateTime.SpecifyKind(approval.RequestedAt, DateTimeKind.Utc),
                ApprovedAt = approval.ApprovedAt.HasValue
                    ? DateTime.SpecifyKind(approval.ApprovedAt.Value, DateTimeKind.Utc)
                    : null
            };
        }

        private static string GetApprovalsPathForRole(RoleType? role)
        {
            return role switch
            {
                RoleType.Admin => "/admin/approvals",
                RoleType.TeamLeader => "/leader/approvals",
                _ => "/member/approvals"
            };
        }
    }
}
