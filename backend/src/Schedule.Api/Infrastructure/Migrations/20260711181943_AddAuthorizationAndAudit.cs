using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorizationAndAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Teams_TeamId",
                table: "Projects");

            migrationBuilder.AddColumn<string>(
                name: "TeamRole",
                table: "TeamMembers",
                type: "TEXT",
                nullable: false,
                defaultValue: "member");

            migrationBuilder.AddColumn<string>(
                name: "ActualEnd",
                table: "Tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActualStart",
                table: "Tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TeamId",
                table: "Projects",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<string>(
                name: "ProjectRole",
                table: "ProjectMembers",
                type: "TEXT",
                nullable: false,
                defaultValue: "member");

            migrationBuilder.Sql("UPDATE TeamMembers SET TeamRole = 'manager' WHERE MemberId = 'yk';");
            migrationBuilder.Sql("UPDATE ProjectMembers SET ProjectRole = 'owner' WHERE MemberId = 'yk';");
            migrationBuilder.Sql("UPDATE ProjectMembers SET ProjectRole = 'planner' WHERE MemberId = 'st';");

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", nullable: false),
                    Action = table.Column<string>(type: "TEXT", nullable: false),
                    ScopeType = table.Column<string>(type: "TEXT", nullable: false),
                    ScopeId = table.Column<string>(type: "TEXT", nullable: true),
                    TargetType = table.Column<string>(type: "TEXT", nullable: true),
                    TargetId = table.Column<string>(type: "TEXT", nullable: true),
                    DetailJson = table.Column<string>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ScopeType_ScopeId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "ScopeType", "ScopeId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Teams_TeamId",
                table: "Projects",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Teams_TeamId",
                table: "Projects");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "TeamRole",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "ActualEnd",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ActualStart",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ProjectRole",
                table: "ProjectMembers");

            migrationBuilder.AlterColumn<string>(
                name: "TeamId",
                table: "Projects",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Teams_TeamId",
                table: "Projects",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
