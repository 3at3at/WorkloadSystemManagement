using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadManagement.Application.DTOs.Tasks;
using WorkloadManagement.Application.Interfaces;

namespace WorkloadManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _taskService.GetAllTasksAsync();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetById(int id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);

            if (task == null)
                return NotFound(new { message = "Task not found." });

            return Ok(task);
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token." });

            var tasks = await _taskService.GetMyTasksAsync(int.Parse(userIdClaim));
            return Ok(tasks);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> CreateTask(CreateTaskDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token." });

                var createdTask = await _taskService.CreateTaskAsync(dto, int.Parse(userIdClaim));
                return Ok(createdTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token." });

                var updatedTask = await _taskService.UpdateTaskAsync(id, dto, int.Parse(userIdClaim));

                if (updatedTask == null)
                    return NotFound(new { message = "Task not found." });

                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> UpdateMyTaskStatus(int id, UpdateMyTaskStatusDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token." });

                var updatedTask = await _taskService.UpdateMyTaskStatusAsync(id, dto, int.Parse(userIdClaim));

                if (updatedTask == null)
                    return NotFound(new { message = "Task not found." });

                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token." });

                var deleted = await _taskService.DeleteTaskAsync(id, int.Parse(userIdClaim));

                if (!deleted)
                    return NotFound(new { message = "Task not found." });

                return Ok(new { message = "Task deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/complete")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CompleteMyTask(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token." });

                var completedTask = await _taskService.CompleteMyTaskAsync(id, int.Parse(userIdClaim));

                if (completedTask == null)
                    return NotFound(new { message = "Task not found." });

                return Ok(completedTask);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("status/{status}")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var tasks = await _taskService.GetTasksByStatusAsync(status);
            return Ok(tasks);
        }
    }
}