using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Application;
using Schedule.Api.Contracts;
using Schedule.Api.Domain;
using Schedule.Api.Infrastructure;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class DailyReportAuthorizationTests
{
    [Fact]
    public async Task ProjectManagerJobRoleDoesNotGrantTeamManagement()
    {
        await using var fixture = await DailyReportFixture.CreateAsync("PM", TeamRoles.Member);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            fixture.Service.SendRemindersAsync(
                new SendDailyReportReminderRequest("team", "2026-07-12", ["target"]),
                fixture.User,
                CancellationToken.None));
    }

    [Fact]
    public async Task TeamManagerRoleCanSendDailyReportReminders()
    {
        await using var fixture = await DailyReportFixture.CreateAsync("SE", TeamRoles.Manager);

        var reminders = await fixture.Service.SendRemindersAsync(
            new SendDailyReportReminderRequest("team", "2026-07-12", ["target"]),
            fixture.User,
            CancellationToken.None);

        Assert.Single(reminders);
    }

    private sealed class DailyReportFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection;
        public DailyReportService Service { get; }
        public AuthUserDto User { get; } = new(
            "user",
            "actor",
            "actor@example.com",
            "担当者",
            SystemRoles.User,
            false);

        private DailyReportFixture(SqliteConnection connection, DailyReportService service)
        {
            this.connection = connection;
            Service = service;
        }

        public static async Task<DailyReportFixture> CreateAsync(string jobRole, string teamRole)
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<ScheduleDbContext>()
                .UseSqlite(connection)
                .Options;
            var db = new ScheduleDbContext(options);
            await db.Database.EnsureCreatedAsync();
            db.Members.AddRange(
                new MemberEntity { Id = "actor", Name = "担当者", Role = jobRole },
                new MemberEntity { Id = "target", Name = "対象者", Role = "SE" });
            db.Teams.Add(new TeamEntity { Id = "team", Name = "開発", Code = "DEV" });
            db.TeamMembers.AddRange(
                new TeamMemberEntity { TeamId = "team", MemberId = "actor", TeamRole = teamRole },
                new TeamMemberEntity { TeamId = "team", MemberId = "target", TeamRole = TeamRoles.Member });
            await db.SaveChangesAsync();
            var authorization = new ProjectAuthorizationService(db);
            return new DailyReportFixture(connection, new DailyReportService(db, authorization));
        }

        public async ValueTask DisposeAsync() => await connection.DisposeAsync();
    }
}
