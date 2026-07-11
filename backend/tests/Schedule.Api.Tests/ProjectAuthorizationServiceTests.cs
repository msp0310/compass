using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Application;
using Schedule.Api.Contracts;
using Schedule.Api.Domain;
using Schedule.Api.Infrastructure;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class ProjectAuthorizationServiceTests
{
    [Theory]
    [InlineData(ProjectRoles.Owner, true, true, true, true)]
    [InlineData(ProjectRoles.Planner, true, true, false, true)]
    [InlineData(ProjectRoles.Member, true, false, false, true)]
    [InlineData(ProjectRoles.Viewer, true, false, false, false)]
    public async Task ProjectRoleResolvesExpectedCapabilities(
        string role,
        bool canView,
        bool canEditPlan,
        bool canManageProject,
        bool canEnterActual)
    {
        await using var fixture = await AuthorizationFixture.CreateAsync(role, TeamRoles.Member);
        var access = await fixture.Service.GetProjectAccessAsync(fixture.User, "project", CancellationToken.None);

        Assert.Equal(canView, access.CanView);
        Assert.Equal(canEditPlan, access.CanEditPlan);
        Assert.Equal(canManageProject, access.CanManageProject);
        Assert.Equal(canEnterActual, access.CanEnterActual);
    }

    [Fact]
    public async Task TeamManagerCanManageStaffingButCannotEditPlan()
    {
        await using var fixture = await AuthorizationFixture.CreateAsync(null, TeamRoles.Manager);
        var access = await fixture.Service.GetProjectAccessAsync(fixture.User, "project", CancellationToken.None);

        Assert.True(access.CanView);
        Assert.True(access.CanManageStaffing);
        Assert.False(access.CanEditPlan);
        Assert.False(access.CanEnterActual);
    }

    [Fact]
    public async Task AccessMapResolvesMultipleProjectsWithoutChangingRoleSemantics()
    {
        await using var fixture = await AuthorizationFixture.CreateAsync(
            ProjectRoles.Member,
            TeamRoles.Manager);
        fixture.Db.Projects.Add(new ProjectEntity
        {
            Id = "other-project",
            TeamId = "team",
            Name = "別案件",
            Workspace = "別案件"
        });
        await fixture.Db.SaveChangesAsync();

        var access = await fixture.Service.GetProjectAccessMapAsync(
            fixture.User,
            new Dictionary<string, string?>
            {
                ["project"] = "team",
                ["other-project"] = "team"
            },
            CancellationToken.None);

        Assert.Equal(ProjectRoles.Member, access["project"].Role);
        Assert.True(access["project"].CanEnterActual);
        Assert.Equal(TeamRoles.Manager, access["other-project"].Role);
        Assert.True(access["other-project"].CanManageStaffing);
        Assert.False(access["other-project"].CanEditPlan);
    }

    private sealed class AuthorizationFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection;
        public ScheduleDbContext Db { get; }
        public ProjectAuthorizationService Service { get; }
        public AuthUserDto User { get; } = new("user", "member", "member@example.com", "担当者", SystemRoles.User, false);

        private AuthorizationFixture(SqliteConnection connection, ScheduleDbContext db)
        {
            this.connection = connection;
            Db = db;
            Service = new ProjectAuthorizationService(db);
        }

        public static async Task<AuthorizationFixture> CreateAsync(string? projectRole, string teamRole)
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<ScheduleDbContext>().UseSqlite(connection).Options;
            var db = new ScheduleDbContext(options);
            await db.Database.EnsureCreatedAsync();
            db.Members.Add(new MemberEntity { Id = "member", Name = "担当者" });
            db.Teams.Add(new TeamEntity { Id = "team", Name = "開発", Code = "DEV" });
            db.TeamMembers.Add(new TeamMemberEntity { TeamId = "team", MemberId = "member", TeamRole = teamRole });
            db.Projects.Add(new ProjectEntity { Id = "project", TeamId = "team", Name = "案件", Workspace = "案件" });
            if (projectRole is not null)
                db.ProjectMembers.Add(new ProjectMemberEntity { ProjectId = "project", MemberId = "member", ProjectRole = projectRole });
            await db.SaveChangesAsync();
            return new AuthorizationFixture(connection, db);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
