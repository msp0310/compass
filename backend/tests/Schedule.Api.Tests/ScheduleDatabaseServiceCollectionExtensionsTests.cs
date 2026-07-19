using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Schedule.Api.Infrastructure;
using Xunit;

namespace Schedule.Api.Tests;

public sealed class ScheduleDatabaseServiceCollectionExtensionsTests
{
    [Fact]
    public void AddScheduleDatabase_DefaultsToSqlite()
    {
        var configuration = new ConfigurationManager();
        var services = new ServiceCollection();

        services.AddScheduleDatabase(configuration);

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ScheduleDbContext>();
        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", db.Database.ProviderName);
    }

    [Fact]
    public void AddScheduleDatabase_RegistersPostgreSqlContext()
    {
        var configuration = new ConfigurationManager
        {
            ["Database:Provider"] = "PostgreSql",
            ["ConnectionStrings:ScheduleDb"] =
                "Host=localhost;Database=compass;Username=compass;Password=test"
        };
        var services = new ServiceCollection();

        services.AddScheduleDatabase(configuration);

        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ScheduleDbContext>();
        Assert.IsType<PostgresScheduleDbContext>(db);
        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", db.Database.ProviderName);
    }

    [Fact]
    public void AddScheduleDatabase_RejectsUnknownProvider()
    {
        var configuration = new ConfigurationManager
        {
            ["Database:Provider"] = "Unknown"
        };

        var exception = Assert.Throws<InvalidOperationException>(() =>
            new ServiceCollection().AddScheduleDatabase(configuration));

        Assert.Contains("Unknown", exception.Message, StringComparison.Ordinal);
    }
}
