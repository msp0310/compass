using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schedule.Api.Infrastructure.PostgresMigrations
{
    /// <inheritdoc />
    public partial class AddProjectType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectTypeId",
                table: "Projects",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectTypeName",
                table: "Projects",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectTypeId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ProjectTypeName",
                table: "Projects");
        }
    }
}
