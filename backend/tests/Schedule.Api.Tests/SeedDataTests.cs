using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Application;
using Schedule.Api.Infrastructure;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class SeedDataTests
{
    [Fact]
    public async Task ProductionBootstrapCreatesForcedResetAdministrator()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ScheduleDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var db = new ScheduleDbContext(options);

        await SeedData.EnsureSeededAsync(
            db,
            false,
            "admin@example.com",
            "InitialPass123!",
            "初期管理者",
            CancellationToken.None);

        var user = await db.Users.SingleAsync();
        Assert.Equal(SystemRoles.Admin, user.Role);
        Assert.True(user.PasswordResetRequired);
        Assert.True(PasswordHasher.VerifyPassword("InitialPass123!", user.PasswordHash));
    }
}
