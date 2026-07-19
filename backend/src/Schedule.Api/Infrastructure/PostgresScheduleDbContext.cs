using Microsoft.EntityFrameworkCore;

namespace Schedule.Api.Infrastructure;

/// <summary>PostgreSQL専用MigrationをSQLite用Migrationから分離するDbContextです。</summary>
public sealed class PostgresScheduleDbContext(
    DbContextOptions<PostgresScheduleDbContext> options) : ScheduleDbContext(options);
