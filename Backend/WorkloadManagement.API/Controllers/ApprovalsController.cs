using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadManagement.Application.DTOs.Approvals;
using WorkloadManagement.Application.Interfaces;

namespace WorkloadManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ApprovalsController : ControllerBase
    {
        private readonly IApprovalService _approvalService;

        public ApprovalsController(IApprovalService approvalService)
        {
            _approvalService = approvalService;
        }

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateApprovalRequest(CreateApprovalRequestDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token.");

            var result = await _approvalService.CreateApprovalRequestAsync(dto, int.Parse(userIdClaim));
            return Ok(result);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var result = await _approvalService.GetPendingApprovalsAsync();
            return Ok(result);
        }

        [HttpGet("my-pending")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetMyPendingApprovals()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token.");

            var result = await _approvalService.GetMyPendingApprovalsAsync(int.Parse(userIdClaim));
            return Ok(result);
        }

        [HttpGet("task/{taskId}")]
        [Authorize(Roles = "Admin,TeamLeader,Member")]
        public async Task<IActionResult> GetByTaskId(int taskId)
        {
            var result = await _approvalService.GetApprovalsByTaskIdAsync(taskId);
            return Ok(result);
        }

        [HttpPost("{approvalId}/review")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> ReviewApproval(int approvalId, ApprovalActionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token.");

            var result = await _approvalService.ReviewApprovalAsync(
                approvalId,
                dto.Approve,
                int.Parse(userIdClaim));

            if (result == null)
                return NotFound("Approval request not found.");

            return Ok(result);
        }
    }
}