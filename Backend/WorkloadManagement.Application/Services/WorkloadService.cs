using System.Globalization;
using WorkloadManagement.Application.DTOs.Workload;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;

namespace WorkloadManagement.Application.Services
{
    public class WorkloadService : IWorkloadService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IUserRepository _userRepository;
        private readonly ITaskAcknowledgementRepository _taskAcknowledgementRepository;

        public WorkloadService(
            ITaskRepository taskRepository,
            IUserRepository userRepository,
            ITaskAcknowledgementRepository taskAcknowledgementRepository)
        {
            _taskRepository = taskRepository;
            _userRepository = userRepository;
            _taskAcknowledgementRepository = taskAcknowledgementRepository;
        }

        public async Task<TaskAcknowledgementDto> AcknowledgeTaskAsync(int taskId, int memberId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
                throw new Exception("Task not found.");

            if (task.AssignedToUserId != memberId)
                throw new Exception("You can only acknowledge your own assigned tasks.");

            var existingAcknowledgement =
                await _taskAcknowledgementRepository.GetByTaskAndMemberAsync(taskId, memberId);

            if (existingAcknowledgement != null)
            {
                existingAcknowledgement.IsAcknowledged = true;
                existingAcknowledgement.AcknowledgedAt = DateTime.UtcNow;

                _taskAcknowledgementRepository.Update(existingAcknowledgement);
                await _taskAcknowledgementRepository.SaveChangesAsync();

                return new TaskAcknowledgementDto
                {
                    TaskId = taskId,
                    MemberId = memberId,
                    IsAcknowledged = true,
                    AcknowledgedAt = existingAcknowledgement.AcknowledgedAt
                };
            }

            var acknowledgement = new TaskAcknowledgement
            {
                TaskItemId = taskId,
                MemberId = memberId,
                IsAcknowledged = true,
                AcknowledgedAt = DateTime.UtcNow
            };

            await _taskAcknowledgementRepository.AddAsync(acknowledgement);
            await _taskAcknowledgementRepository.SaveChangesAsync();

            return new TaskAcknowledgementDto
            {
                TaskId = taskId,
                MemberId = memberId,
                IsAcknowledged = true,
                AcknowledgedAt = acknowledgement.AcknowledgedAt
            };
        }

        public async Task<MemberWorkloadDto?> GetMemberWeeklyWorkloadAsync(int userId, int weekNumber, int year)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return null;

            var allUserTasks = await _taskRepository.GetTasksByUserIdAsync(userId);

            var activeTasks = allUserTasks
                .Where(t => t.Status != WorkloadManagement.Domain.Enums.TaskStatus.Completed)
                .ToList();

            decimal totalWeight = 0;
            int taskCount = 0;

            foreach (var task in activeTasks)
            {
                var portion = GetWeightPortionForWeek(task, weekNumber, year);

                if (portion > 0)
                {
                    totalWeight += portion;
                    taskCount++;
                }
            }

            totalWeight = Math.Round(totalWeight, 2);

            return new MemberWorkloadDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                WeekNumber = weekNumber,
                Year = year,
                TotalWeight = totalWeight,
                TaskCount = taskCount,
                WorkloadStatus = GetWorkloadStatus(totalWeight),
                TeamLeaderId = user.TeamLeaderId,
                TeamLeaderName = user.TeamLeader?.FullName
            };
        }

        public async Task<WorkloadSummaryDto> GetWeeklyTeamWorkloadAsync(int requesterId, string requesterRole, int weekNumber, int year)
        {
            IEnumerable<User> members;

            if (requesterRole == RoleType.Admin.ToString())
            {
                members = await _userRepository.GetMembersAsync();
            }
            else if (requesterRole == RoleType.TeamLeader.ToString())
            {
                members = await _userRepository.GetMembersByTeamLeaderIdAsync(requesterId);
            }
            else
            {
                throw new Exception("You are not allowed to view team workload.");
            }

            var memberWorkloads = new List<MemberWorkloadDto>();

            foreach (var member in members)
            {
                var memberWorkload = await GetMemberWeeklyWorkloadAsync(member.Id, weekNumber, year);

                if (memberWorkload != null)
                {
                    memberWorkloads.Add(memberWorkload);
                }
            }

            return new WorkloadSummaryDto
            {
                Members = memberWorkloads,
                OverloadedCount = memberWorkloads.Count(m => m.WorkloadStatus == "Overloaded"),
                BalancedCount = memberWorkloads.Count(m => m.WorkloadStatus == "Balanced"),
                AvailableCount = memberWorkloads.Count(m => m.WorkloadStatus == "Available")
            };
        }

        private static List<(int WeekNumber, int Year)> GetCoveredWeeks(DateTime startDate, DateTime dueDate)
        {
            var weeks = new List<(int WeekNumber, int Year)>();

            var current = startDate.Date;
            var end = dueDate.Date;

            while (current <= end)
            {
                var week = ISOWeek.GetWeekOfYear(current);
                var year = ISOWeek.GetYear(current);

                if (!weeks.Contains((week, year)))
                {
                    weeks.Add((week, year));
                }

                current = current.AddDays(1);
            }

            return weeks;
        }

        private static decimal GetWeightPortionForWeek(TaskItem task, int weekNumber, int year)
        {
            var coveredWeeks = GetCoveredWeeks(task.StartDate, task.DueDate);

            var isCovered = coveredWeeks.Any(w => w.WeekNumber == weekNumber && w.Year == year);
            if (!isCovered || coveredWeeks.Count == 0)
                return 0;

            return task.Weight / coveredWeeks.Count;
        }

        private static string GetWorkloadStatus(decimal totalWeight)
        {
            if (totalWeight >= 36)
                return "Overloaded";

            if (totalWeight >= 21)
                return "Balanced";

            return "Available";
        }
    }
}