using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkloadManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamLeaderRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeamLeaderId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TeamLeaderId",
                table: "Users",
                column: "TeamLeaderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_TeamLeaderId",
                table: "Users",
                column: "TeamLeaderId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_TeamLeaderId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TeamLeaderId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TeamLeaderId",
                table: "Users");
        }
    }
}
