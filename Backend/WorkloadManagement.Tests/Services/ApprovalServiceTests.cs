using FluentAssertions;
using Moq;
using WorkloadManagement.Application.DTOs.Approvals;
using WorkloadManagement.Application.DTOs.Notifications;
using WorkloadManagement.Application.Interfaces;
using WorkloadManagement.Application.Services;
using WorkloadManagement.Domain.Entities;
using WorkloadManagement.Domain.Enums;
using WorkloadManagement.Domain.Interfaces;
using WorkloadManagement.Tests.Helpers;

namespace WorkloadManagement.Tests.Services
{
    public class ApprovalServiceTests
    {
        private readonly Mock<ITaskApprovalRepository> _approvalRepo = new();
        private readonly Mock<ITaskRepository> _taskRepo = new();
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<INotificationService> _notificationService = new();
        private readonly ApprovalService _sut;

        public ApprovalServiceTests()
        {
            _sut = new ApprovalService(_approvalRepo.Object, _taskRepo.Object, _userRepo.Object, _notificationService.Object);
            _notificationService.Setup(n => n.CreateManyAsync(It.IsAny<IEnumerable<CreateNotificationDto>>())).Returns(Task.CompletedTask);
        }

        // ── CreateApprovalRequest ─────────────────────────────────────────────

        [Fact]
        public async Task CreateApprovalRequestAsync_MemberToLeader_CreatesApproval()
        {
            var task = EntityFactory.Task(assignedToUserId: 3, createdByUserId: 2);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            var leader = EntityFactory.LeaderUser(id: 2);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(leader);
            _approvalRepo.Setup(r => r.AddAsync(It.IsAny<TaskApproval>())).Returns(Task.CompletedTask);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _approvalRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 2,
                RequestReason = "Need approval"
            }, requestedByUserId: 3);

            result.Should().NotBeNull();
            result.RequestedByUserId.Should().Be(3);
            result.TargetApproverUserId.Should().Be(2);
            result.ApprovalStatus.Should().Be("Pending");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_EmptyReason_Throws()
        {
            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 2,
                RequestReason = "   "
            }, requestedByUserId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*reason is required*");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_TaskNotFound_Throws()
        {
            _taskRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((TaskItem?)null);

            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 99,
                TargetApproverUserId = 2,
                RequestReason = "Reason"
            }, requestedByUserId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*Task not found*");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_MemberSendsToAdmin_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            var admin = EntityFactory.AdminUser(id: 1);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);

            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 1,
                RequestReason = "Reason"
            }, requestedByUserId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*Team Leader*");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_MemberSendsToWrongLeader_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);       // belongs to leader 2
            var otherLeader = EntityFactory.LeaderUser(id: 10);                   // different leader

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(otherLeader);

            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 10,
                RequestReason = "Reason"
            }, requestedByUserId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*own team leader*");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_MemberWithoutTeamLeader_Throws()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: null);
            var leader = EntityFactory.LeaderUser(id: 2);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(leader);

            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 2,
                RequestReason = "Reason"
            }, requestedByUserId: 3);

            await act.Should().ThrowAsync<Exception>().WithMessage("*not assigned to any team leader*");
        }

        [Fact]
        public async Task CreateApprovalRequestAsync_AdminRequests_Throws()
        {
            var task = EntityFactory.Task();
            var admin = EntityFactory.AdminUser(id: 1);
            var targetAdmin = EntityFactory.AdminUser(id: 5);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(admin);
            _userRepo.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(targetAdmin);

            var act = () => _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 5,
                RequestReason = "Reason"
            }, requestedByUserId: 1);

            await act.Should().ThrowAsync<Exception>().WithMessage("*Admin does not need*");
        }

        // ── ReviewApproval ────────────────────────────────────────────────────

        [Fact]
        public async Task ReviewApprovalAsync_Approve_SetsApprovedStatus()
        {
            var approval = EntityFactory.PendingApproval(requestedById: 3, targetApproverId: 2);
            var task = EntityFactory.Task(assignedToUserId: 3, createdByUserId: 1);
            var requester = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            var approver = EntityFactory.LeaderUser(id: 2);

            approval.TaskItem = task;
            approval.RequestedByUser = requester;
            approval.TargetApproverUser = approver;

            _approvalRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(approval);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(approver);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _approvalRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.ReviewApprovalAsync(1, approve: true, approvedByUserId: 2);

            result.Should().NotBeNull();
            result!.ApprovalStatus.Should().Be("Approved");
            result.ApprovedBy.Should().Be("Leader User");
        }

        [Fact]
        public async Task ReviewApprovalAsync_Reject_SetsRejectedStatus()
        {
            var approval = EntityFactory.PendingApproval(requestedById: 3, targetApproverId: 2);
            var task = EntityFactory.Task();
            var requester = EntityFactory.MemberUser(id: 3);
            var approver = EntityFactory.LeaderUser(id: 2);

            approval.TaskItem = task;
            approval.RequestedByUser = requester;
            approval.TargetApproverUser = approver;

            _approvalRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(approval);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(approver);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _approvalRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.ReviewApprovalAsync(1, approve: false, approvedByUserId: 2);

            result!.ApprovalStatus.Should().Be("Rejected");
        }

        [Fact]
        public async Task ReviewApprovalAsync_NotFoundApproval_ReturnsNull()
        {
            _approvalRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((TaskApproval?)null);

            var result = await _sut.ReviewApprovalAsync(99, approve: true, approvedByUserId: 2);

            result.Should().BeNull();
        }

        [Fact]
        public async Task ReviewApprovalAsync_AlreadyReviewed_Throws()
        {
            var approval = EntityFactory.PendingApproval();
            approval.ApprovalStatus = ApprovalStatus.Approved;
            _approvalRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(approval);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(EntityFactory.LeaderUser());

            var act = () => _sut.ReviewApprovalAsync(1, approve: true, approvedByUserId: 2);

            await act.Should().ThrowAsync<Exception>().WithMessage("*already been reviewed*");
        }

        [Fact]
        public async Task ReviewApprovalAsync_WrongApprover_Throws()
        {
            var approval = EntityFactory.PendingApproval(targetApproverId: 2);
            _approvalRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(approval);
            _userRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync(EntityFactory.AdminUser(99));

            var act = () => _sut.ReviewApprovalAsync(1, approve: true, approvedByUserId: 99);

            await act.Should().ThrowAsync<Exception>().WithMessage("*not the assigned approver*");
        }

        // ── GetMyPendingApprovals ─────────────────────────────────────────────

        [Fact]
        public async Task GetMyPendingApprovalsAsync_ReturnsCorrectApprovals()
        {
            var approval = EntityFactory.PendingApproval(targetApproverId: 2);
            approval.TaskItem = EntityFactory.Task();
            approval.RequestedByUser = EntityFactory.MemberUser();
            approval.TargetApproverUser = EntityFactory.LeaderUser();

            _approvalRepo.Setup(r => r.GetPendingApprovalsForApproverAsync(2))
                .ReturnsAsync(new[] { approval });

            var result = await _sut.GetMyPendingApprovalsAsync(2);

            result.Should().HaveCount(1);
            result.First().TargetApproverUserId.Should().Be(2);
        }

        // ── RequestedAt UTC ───────────────────────────────────────────────────

        [Fact]
        public async Task CreateApprovalRequestAsync_RequestedAt_HasUtcKind()
        {
            var task = EntityFactory.Task(assignedToUserId: 3);
            var member = EntityFactory.MemberUser(id: 3, teamLeaderId: 2);
            var leader = EntityFactory.LeaderUser(id: 2);

            _taskRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(task);
            _userRepo.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(member);
            _userRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(leader);
            _approvalRepo.Setup(r => r.AddAsync(It.IsAny<TaskApproval>())).Returns(Task.CompletedTask);
            _taskRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _approvalRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _sut.CreateApprovalRequestAsync(new CreateApprovalRequestDto
            {
                TaskId = 1,
                TargetApproverUserId = 2,
                RequestReason = "Test reason"
            }, requestedByUserId: 3);

            result.RequestedAt.Kind.Should().Be(DateTimeKind.Utc);
        }
    }
}
