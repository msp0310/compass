using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectNo",
                table: "Projects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE Projects
                SET ProjectNo = CASE Id
                    WHEN 'site-renewal' THEN 'PJ-2025-001'
                    WHEN 'crm-integration' THEN 'PJ-2025-002'
                    WHEN 'cloud-migration' THEN 'PJ-2025-003'
                    ELSE ProjectNo
                END
                WHERE Id IN ('site-renewal', 'crm-integration', 'cloud-migration');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectNo",
                table: "Projects");
        }
    }
}
