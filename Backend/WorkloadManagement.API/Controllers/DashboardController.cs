using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadManagement.Application.Interfaces;

namespace WorkloadManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("admin-summary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminSummary([FromQuery] int weekNumber, [FromQuery] int year)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token." });

            var result = await _dashboardService.GetAdminSummaryAsync(
                int.Parse(userIdClaim),
                weekNumber,
                year
            );

            return Ok(result);
        }

        [HttpGet("leader-summary")]
        [Authorize(Roles = "TeamLeader")]
        public async Task<IActionResult> GetLeaderSummary([FromQuery] int weekNumber, [FromQuery] int year)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token." });

            var result = await _dashboardService.GetLeaderSummaryAsync(
                int.Parse(userIdClaim),
                weekNumber,
                year
            );

            return Ok(result);
        }

        [HttpGet("member-summary")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMemberSummary([FromQuery] int weekNumber, [FromQuery] int year)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token." });

            var result = await _dashboardService.GetMemberSummaryAsync(
                int.Parse(userIdClaim),
                weekNumber,
                year
            );

            return Ok(result);
        }
    }
}