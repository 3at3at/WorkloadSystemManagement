using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadManagement.Application.Interfaces;

namespace WorkloadManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkloadController : ControllerBase
    {
        private readonly IWorkloadService _workloadService;

        public WorkloadController(IWorkloadService workloadService)
        {
            _workloadService = workloadService;
        }

        [HttpPost("acknowledge/{taskId}")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> AcknowledgeTask(int taskId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token.");

            var result = await _workloadService.AcknowledgeTaskAsync(taskId, int.Parse(userIdClaim));
            return Ok(result);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMyWorkload([FromQuery] int weekNumber, [FromQuery] int year)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Invalid token.");

            var result = await _workloadService.GetMemberWeeklyWorkloadAsync(
                int.Parse(userIdClaim),
                weekNumber,
                year
            );

            if (result == null)
                return NotFound("Member not found.");

            return Ok(result);
        }

        [HttpGet("member/{userId}")]
        [Authorize(Roles = "Admin,TeamLeader,Member")]
        public async Task<IActionResult> GetMemberWorkload(int userId, [FromQuery] int weekNumber, [FromQuery] int year)
        {
            var result = await _workloadService.GetMemberWeeklyWorkloadAsync(userId, weekNumber, year);

            if (result == null)
                return NotFound("Member not found.");

            return Ok(result);
        }

        [HttpGet("team")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetTeamWorkload([FromQuery] int weekNumber, [FromQuery] int year)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
                return Unauthorized("Invalid token.");

            var result = await _workloadService.GetWeeklyTeamWorkloadAsync(
                int.Parse(userIdClaim),
                roleClaim,
                weekNumber,
                year
            );

            return Ok(result);
        }
    }
}