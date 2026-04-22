using System.Globalization;
using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.DTOs.Tasks;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using TaskStatusEnum = WorkloadManagement.Domain.Enums.TaskStatus;

namespace WorkloadManagement.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;

        public TaskService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            INotificationService notificationService)
        {
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<TaskDto>> GetAllTasksAsync()
        {
            var tasks = await _taskRepository.GetAllAsync();
            return tasks.Select(MapToTaskDto);
        }

        public async Task<TaskDetailsDto?> GetTaskByIdAsync(int id)
        {
            var task = await _taskRepository.GetByIdAsync(id);

            if (task == null)
                return null;

            return MapToTaskDetailsDto(task);
        }

        public async Task<IEnumerable<TaskDto>> GetMyTasksAsync(int userId)
        {
            var tasks = await _taskRepository.GetTasksByUserIdAsync(userId);
            return tasks.Select(MapToTaskDto);
        }

        public async Task<TaskDetailsDto> CreateTaskAsync(CreateTaskDto dto, int createdByUserId)
        {
            var assignedUser = await _userRepository.GetByIdAsync(dto.AssignedToUserId);
            if (assignedUser == null)
                throw new Exception("Assigned user not found.");

            var createdByUser = await _userRepository.GetByIdAsync(createdByUserId);
            if (createdByUser == null)
                throw new Exception("Creator user not found.");

            if (createdByUser.Role?.Name == RoleType.TeamLeader)
            {
                var isSelf = assignedUser.Id == createdByUser.Id;
                var isOwnMember = assignedUser.TeamLeaderId == createdByUser.Id;

                if (!isSelf && !isOwnMember)
                    throw new Exception("You can only assign tasks to yourself or your own team members.");
            }

            var weekNumber = ISOWeek.GetWeekOfYear(dto.DueDate);
            var year = dto.DueDate.Year;

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                AssignedToUserId = dto.AssignedToUserId,
                CreatedByUserId = createdByUserId,
                Priority = dto.Priority,
                Complexity = dto.Complexity,
                Status = TaskStatusEnum.New,
                EstimatedHours = dto.EstimatedHours,
                Weight = CalculateWeight(dto.EstimatedHours, dto.Complexity, dto.Priority),
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                WeekNumber = weekNumber,
                Year = year,
                IsMajorChangePendingApproval = false
            };

            await _taskRepository.AddAsync(task);
            await _taskRepository.SaveChangesAsync();

            task.AssignedToUser = assignedUser;
            task.CreatedByUser = createdByUser;

            if (assignedUser.Id != createdByUserId)
            {
                await _notificationService.CreateAsync(new CreateNotificationDto
                {
                    UserId = assignedUser.Id,
                    Type = NotificationType.TaskAssigned,
                    Title = "New task assigned",
                    Message = $"You were assigned \"{task.Title}\" by {createdByUser.FullName}.",
                    RelatedEntityId = task.Id,
                    ActionUrl = GetTasksPathForRole(assignedUser.Role?.Name)
                });
            }

            return MapToTaskDetailsDto(task);
        }

        public async Task<TaskDetailsDto?> UpdateTaskAsync(int id, UpdateTaskDto dto, int currentUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
                return null;

            var previousAssignedToUserId = task.AssignedToUserId;
            var previousAssignedUser = task.AssignedToUserId == dto.AssignedToUserId
                ? task.AssignedToUser
                : await _userRepository.GetByIdAsync(task.AssignedToUserId);

            var currentUser = await _userRepository.GetByIdAsync(currentUserId);
            if (currentUser == null)
                throw new Exception("Current user not found.");

            await EnsureCanManageTaskAsync(task, currentUser);

            var assignedUser = await _userRepository.GetByIdAsync(dto.AssignedToUserId);
            if (assignedUser == null)
                throw new Exception("Assigned user not found.");

            if (currentUser.Role?.Name == RoleType.TeamLeader)
            {
                var isOwnMember = assignedUser.TeamLeaderId == currentUser.Id;
                if (!isOwnMember)
                    throw new Exception("You can only assign tasks to your own team members.");
            }

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.AssignedToUserId = dto.AssignedToUserId;
            task.Priority = dto.Priority;
            task.Complexity = dto.Complexity;
            task.EstimatedHours = dto.EstimatedHours;
            task.Weight = CalculateWeight(dto.EstimatedHours, dto.Complexity, dto.Priority);
            task.StartDate = dto.StartDate;
            task.DueDate = dto.DueDate;
            task.WeekNumber = ISOWeek.GetWeekOfYear(dto.DueDate);
            task.Year = dto.DueDate.Year;
            task.UpdatedAt = DateTime.UtcNow;

            PrepareTaskForWrite(task);
            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();

            task.AssignedToUser = assignedUser;
            task.CreatedByUser = await _userRepository.GetByIdAsync(task.CreatedByUserId) ?? task.CreatedByUser;

            if (previousAssignedToUserId != dto.AssignedToUserId)
            {
                if (previousAssignedUser != null && previousAssignedUser.Id != currentUserId)
                {
                    await _notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = previousAssignedUser.Id,
                        Type = NotificationType.TaskAssigned,
                        Title = "Task reassigned",
                        Message = $"Task \"{task.Title}\" is no longer assigned to you.",
                        RelatedEntityId = task.Id,
                        ActionUrl = GetTasksPathForRole(previousAssignedUser.Role?.Name)
                    });
                }

                if (assignedUser.Id != currentUserId)
                {
                    await _notificationService.CreateAsync(new CreateNotificationDto
                    {
                        UserId = assignedUser.Id,
                        Type = NotificationType.TaskAssigned,
                        Title = "Task reassigned",
                        Message = $"Task \"{task.Title}\" was reassigned to you by {currentUser.FullName}.",
                        RelatedEntityId = task.Id,
                        ActionUrl = GetTasksPathForRole(assignedUser.Role?.Name)
                    });
                }
            }

            return MapToTaskDetailsDto(task);
        }

        public async Task<TaskDetailsDto?> UpdateMyTaskStatusAsync(int id, UpdateMyTaskStatusDto dto, int currentUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
                return null;

            if (task.AssignedToUserId != currentUserId)
                throw new Exception("You can only update the status of your own assigned tasks.");

            if (dto.Status == TaskStatusEnum.Completed)
                throw new Exception("Use Mark Done to complete a task.");

            task.Status = dto.Status;
            task.UpdatedAt = DateTime.UtcNow;

            PrepareTaskForWrite(task);
            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();

            task.AssignedToUser = await _userRepository.GetByIdAsync(task.AssignedToUserId) ?? task.AssignedToUser;
            task.CreatedByUser = await _userRepository.GetByIdAsync(task.CreatedByUserId) ?? task.CreatedByUser;

            if (task.CreatedByUserId != currentUserId && task.CreatedByUser != null)
            {
                var assignee = task.AssignedToUser ?? await _userRepository.GetByIdAsync(currentUserId);

                await _notificationService.CreateAsync(new CreateNotificationDto
                {
                    UserId = task.CreatedByUserId,
                    Type = NotificationType.TaskStatusChanged,
                    Title = "Task status updated",
                    Message = $"{assignee?.FullName ?? "A user"} changed \"{task.Title}\" to {NormalizeStatus(task.Status)}.",
                    RelatedEntityId = task.Id,
                    ActionUrl = GetTasksPathForRole(task.CreatedByUser.Role?.Name)
                });
            }

            return MapToTaskDetailsDto(task);
        }

        public async Task<bool> DeleteTaskAsync(int id, int currentUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
                return false;

            var currentUser = await _userRepository.GetByIdAsync(currentUserId);
            if (currentUser == null)
                throw new Exception("Current user not found.");

            await EnsureCanManageTaskAsync(task, currentUser);

            PrepareTaskForWrite(task);
            _taskRepository.Delete(task);
            await _taskRepository.SaveChangesAsync();

            return true;
        }

        public async Task<TaskDetailsDto?> CompleteMyTaskAsync(int id, int memberId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
                return null;

            if (task.AssignedToUserId != memberId)
                throw new Exception("You can only complete your own assigned tasks.");

            task.Status = TaskStatusEnum.Completed;
            task.UpdatedAt = DateTime.UtcNow;

            PrepareTaskForWrite(task);
            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();

            task.AssignedToUser = await _userRepository.GetByIdAsync(task.AssignedToUserId) ?? task.AssignedToUser;
            task.CreatedByUser = await _userRepository.GetByIdAsync(task.CreatedByUserId) ?? task.CreatedByUser;

            if (task.CreatedByUserId != memberId && task.CreatedByUser != null)
            {
                var completedByUser = task.AssignedToUser ?? await _userRepository.GetByIdAsync(memberId);

                await _notificationService.CreateAsync(new CreateNotificationDto
                {
                    UserId = task.CreatedByUserId,
                    Type = NotificationType.TaskCompleted,
                    Title = "Task completed",
                    Message = $"{completedByUser?.FullName ?? "A user"} marked \"{task.Title}\" as completed.",
                    RelatedEntityId = task.Id,
                    ActionUrl = GetTasksPathForRole(task.CreatedByUser.Role?.Name)
                });
            }

            return MapToTaskDetailsDto(task);
        }

        public async Task<IEnumerable<TaskDto>> GetTasksByStatusAsync(string status)
        {
            var tasks = await _taskRepository.GetTasksByStatusAsync(status);
            return tasks.Select(MapToTaskDto);
        }

        private async Task EnsureCanManageTaskAsync(TaskItem task, User currentUser)
        {
            if (currentUser.Role?.Name == RoleType.Admin)
                return;

            if (currentUser.Role?.Name == RoleType.TeamLeader)
            {
                var createdByLeader = task.CreatedByUserId == currentUser.Id;
                var assignedToLeader = task.AssignedToUserId == currentUser.Id;

                if (!createdByLeader)
                    throw new Exception("You can only edit or delete tasks created by you.");

                if (assignedToLeader)
                    throw new Exception("You cannot edit or delete tasks assigned to you by Admin.");

                var assignedUser = await _userRepository.GetByIdAsync(task.AssignedToUserId);
                if (assignedUser == null || assignedUser.TeamLeaderId != currentUser.Id)
                    throw new Exception("You can only manage tasks assigned to your own team members.");

                return;
            }

            throw new Exception("You are not allowed to manage this task.");
        }

        private decimal CalculateWeight(int estimatedHours, TaskComplexity complexity, TaskPriority priority)
        {
            decimal complexityFactor = complexity switch
            {
                TaskComplexity.Easy => 1.0m,
                TaskComplexity.Medium => 1.5m,
                TaskComplexity.Hard => 2.0m,
                _ => 1.0m
            };

            decimal priorityFactor = priority switch
            {
                TaskPriority.Low => 1.0m,
                TaskPriority.Medium => 1.2m,
                TaskPriority.High => 1.5m,
                TaskPriority.Critical => 2.0m,
                _ => 1.0m
            };

            return estimatedHours * complexityFactor * priorityFactor;
        }

        private static string NormalizeStatus(TaskStatusEnum status)
        {
            return status switch
            {
                TaskStatusEnum.New => "New",
                TaskStatusEnum.InProgress => "In Progress",
                TaskStatusEnum.Blocked => "Blocked",
                TaskStatusEnum.Completed => "Completed",
                _ => status.ToString()
            };
        }

        private static TaskDto MapToTaskDto(TaskItem task)
        {
            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                AssignedToUserId = task.AssignedToUserId,
                AssignedTo = task.AssignedToUser?.FullName ?? string.Empty,
                CreatedByUserId = task.CreatedByUserId,
                CreatedBy = task.CreatedByUser?.FullName ?? string.Empty,
                Priority = task.Priority.ToString(),
                Complexity = task.Complexity.ToString(),
                Status = NormalizeStatus(task.Status),
                EstimatedHours = task.EstimatedHours,
                Weight = task.Weight,
                DueDate = task.DueDate
            };
        }

        private static TaskDetailsDto MapToTaskDetailsDto(TaskItem task)
        {
            return new TaskDetailsDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                AssignedToUserId = task.AssignedToUserId,
                AssignedTo = task.AssignedToUser?.FullName ?? string.Empty,
                CreatedByUserId = task.CreatedByUserId,
                CreatedBy = task.CreatedByUser?.FullName ?? string.Empty,
                Priority = task.Priority.ToString(),
                Complexity = task.Complexity.ToString(),
                Status = NormalizeStatus(task.Status),
                EstimatedHours = task.EstimatedHours,
                Weight = task.Weight,
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                WeekNumber = task.WeekNumber,
                Year = task.Year,
                IsMajorChangePendingApproval = task.IsMajorChangePendingApproval
            };
        }

        private static string GetTasksPathForRole(RoleType? role)
        {
            return role switch
            {
                RoleType.Admin => "/admin/tasks",
                RoleType.TeamLeader => "/leader/tasks",
                _ => "/member/tasks"
            };
        }

        private static void PrepareTaskForWrite(TaskItem task)
        {
            task.AssignedToUser = null!;
            task.CreatedByUser = null!;
            task.Acknowledgements = new List<TaskAcknowledgement>();
            task.Approvals = new List<TaskApproval>();
        }
    }
}
