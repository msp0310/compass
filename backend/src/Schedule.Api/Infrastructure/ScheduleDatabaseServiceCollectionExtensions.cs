using Microsoft.EntityFrameworkCore;

namespace Schedule.Api.Infrastructure;

/// <summary>設定に応じてCOMPASSのデータベースプロバイダーを登録します。</summary>
public static class ScheduleDatabaseServiceCollectionExtensions
{
    private const string DefaultSqliteConnection = "Data Source=schedule-manager.db";

    /// <summary>SQLiteまたはPostgreSQLのDbContextを登録します。</summary>
    public static IServiceCollection AddScheduleDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"]?.Trim() ?? "Sqlite";
        var connectionString = configuration.GetConnectionString("ScheduleDb");

        if (provider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase) ||
            provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "PostgreSQLを使用する場合はConnectionStrings:ScheduleDbが必要です。");
            }

            services.AddDbContext<PostgresScheduleDbContext>(options =>
                options.UseNpgsql(connectionString));
            services.AddScoped<ScheduleDbContext>(services =>
                services.GetRequiredService<PostgresScheduleDbContext>());
            return services;
        }

        if (!provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"未対応のデータベースプロバイダーです: {provider}");
        }

        services.AddDbContext<ScheduleDbContext>(options =>
            options.UseSqlite(connectionString ?? DefaultSqliteConnection));
        return services;
    }
}
