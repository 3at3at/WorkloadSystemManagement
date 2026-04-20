using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkloadManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ApprovalHierarchyUpgrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TargetApproverUserId",
                table: "TaskApprovals",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TaskApprovals_TargetApproverUserId",
                table: "TaskApprovals",
                column: "TargetApproverUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskApprovals_Users_TargetApproverUserId",
                table: "TaskApprovals",
                column: "TargetApproverUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskApprovals_Users_TargetApproverUserId",
                table: "TaskApprovals");

            migrationBuilder.DropIndex(
                name: "IX_TaskApprovals_TargetApproverUserId",
                table: "TaskApprovals");

            migrationBuilder.DropColumn(
                name: "TargetApproverUserId",
                table: "TaskApprovals");
        }
    }
}
