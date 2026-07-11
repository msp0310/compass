using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Schedule.Api.Infrastructure;

/// <summary>EF Core Migration生成時にアプリ起動処理へ依存せずDbContextを作成します。</summary>
public sealed class ScheduleDbContextFactory : IDesignTimeDbContextFactory<ScheduleDbContext>
{
    /// <summary>Migration用のSQLite接続を設定したDbContextを作成します。</summary>
    public ScheduleDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("SCHEDULE_DB_CONNECTION")
            ?? "Data Source=schedule-manager.dev.db";
        var options = new DbContextOptionsBuilder<ScheduleDbContext>()
            .UseSqlite(connectionString)
            .Options;
        return new ScheduleDbContext(options);
    }
}
