using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeWeeklyCapacity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Members SET CapacityHours = CapacityHours * 5 WHERE CapacityHours > 0 AND CapacityHours <= 12;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Members SET CapacityHours = CapacityHours / 5 WHERE CapacityHours > 12 AND CapacityHours <= 60;");
        }
    }
}
