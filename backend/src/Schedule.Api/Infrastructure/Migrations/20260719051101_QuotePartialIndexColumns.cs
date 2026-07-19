using Microsoft.EntityFrameworkCore.Migrations;

#pragma warning disable CA1861
#nullable disable

namespace Schedule.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class QuotePartialIndexColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_MemberId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Teams_ExternalSource_ExternalId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ExternalSource_ExternalId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_ExternalSource_ExternalId",
                table: "ProjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Members_EmployeeNo",
                table: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Members_ExternalSource_ExternalId",
                table: "Members");

            migrationBuilder.CreateIndex(
                name: "IX_Users_MemberId",
                table: "Users",
                column: "MemberId",
                unique: true,
                filter: "\"MemberId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_ExternalSource_ExternalId",
                table: "Teams",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ExternalSource_ExternalId",
                table: "Projects",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_ExternalSource_ExternalId",
                table: "ProjectAssignments",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Members_EmployeeNo",
                table: "Members",
                column: "EmployeeNo",
                unique: true,
                filter: "\"EmployeeNo\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Members_ExternalSource_ExternalId",
                table: "Members",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "\"ExternalSource\" IS NOT NULL AND \"ExternalId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_MemberId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Teams_ExternalSource_ExternalId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ExternalSource_ExternalId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignments_ExternalSource_ExternalId",
                table: "ProjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Members_EmployeeNo",
                table: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Members_ExternalSource_ExternalId",
                table: "Members");

            migrationBuilder.CreateIndex(
                name: "IX_Users_MemberId",
                table: "Users",
                column: "MemberId",
                unique: true,
                filter: "MemberId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_ExternalSource_ExternalId",
                table: "Teams",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "ExternalSource IS NOT NULL AND ExternalId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ExternalSource_ExternalId",
                table: "Projects",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "ExternalSource IS NOT NULL AND ExternalId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignments_ExternalSource_ExternalId",
                table: "ProjectAssignments",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "ExternalSource IS NOT NULL AND ExternalId IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Members_EmployeeNo",
                table: "Members",
                column: "EmployeeNo",
                unique: true,
                filter: "EmployeeNo IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Members_ExternalSource_ExternalId",
                table: "Members",
                columns: new[] { "ExternalSource", "ExternalId" },
                unique: true,
                filter: "ExternalSource IS NOT NULL AND ExternalId IS NOT NULL");
        }
    }
}
