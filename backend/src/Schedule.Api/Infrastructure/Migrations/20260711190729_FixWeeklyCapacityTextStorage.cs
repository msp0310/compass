using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixWeeklyCapacityTextStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE Members SET CapacityHours = CAST(CapacityHours AS REAL) * 5 " +
                "WHERE CAST(CapacityHours AS REAL) > 0 AND CAST(CapacityHours AS REAL) <= 12;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE Members SET CapacityHours = CAST(CapacityHours AS REAL) / 5 " +
                "WHERE CAST(CapacityHours AS REAL) > 12 AND CAST(CapacityHours AS REAL) <= 60;");
        }
    }
}
