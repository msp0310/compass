using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Schedule.Api.Infrastructure;

/// <summary>PostgreSQL用Migrationを生成するDbContextを作成します。</summary>
public sealed class PostgresScheduleDbContextFactory :
    IDesignTimeDbContextFactory<PostgresScheduleDbContext>
{
    /// <summary>Migration生成専用のPostgreSQL接続を設定します。</summary>
    public PostgresScheduleDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("SCHEDULE_POSTGRES_CONNECTION")
            ?? "Host=localhost;Database=compass;Username=compass;Password=compass";
        var options = new DbContextOptionsBuilder<PostgresScheduleDbContext>()
            .UseNpgsql(connectionString)
            .Options;
        return new PostgresScheduleDbContext(options);
    }
}
