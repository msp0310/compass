using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyReportNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyReportReads",
                columns: table => new
                {
                    ReportId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    CommentCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ReadAt = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyReportReads", x => new { x.ReportId, x.UserId });
                });

            migrationBuilder.CreateTable(
                name: "DailyReportReminders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    TeamId = table.Column<string>(type: "TEXT", nullable: false),
                    Date = table.Column<string>(type: "TEXT", nullable: false),
                    RecipientMemberId = table.Column<string>(type: "TEXT", nullable: false),
                    SenderUserId = table.Column<string>(type: "TEXT", nullable: false),
                    SenderName = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<string>(type: "TEXT", nullable: false),
                    ReadAt = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyReportReminders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyReportReminders_RecipientMemberId_ReadAt",
                table: "DailyReportReminders",
                columns: ["RecipientMemberId", "ReadAt"]);

            migrationBuilder.CreateIndex(
                name: "IX_DailyReportReminders_TeamId_Date_RecipientMemberId",
                table: "DailyReportReminders",
                columns: ["TeamId", "Date", "RecipientMemberId"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyReportReads");

            migrationBuilder.DropTable(
                name: "DailyReportReminders");
        }
    }
}
