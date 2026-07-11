using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Contracts;
using Schedule.Api.Domain;
using Schedule.Api.Infrastructure;

namespace Schedule.Api.Application;

/// <summary>認証・権限・データ変更を追跡可能な形で記録します。</summary>
public sealed class AuditLogService(
    ScheduleDbContext db,
    IHttpContextAccessor httpContextAccessor)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>監査対象の操作を1件記録します。</summary>
    public async Task RecordAsync(
        AuthUserDto user,
        string action,
        string scopeType,
        string? scopeId,
        string? targetType,
        string? targetId,
        object? detail,
        CancellationToken cancellationToken)
    {
        db.AuditLogs.Add(new AuditLogEntity
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            UserName = user.Name,
            Action = action,
            ScopeType = scopeType,
            ScopeId = scopeId,
            TargetType = targetType,
            TargetId = targetId,
            DetailJson = detail is null ? null : JsonSerializer.Serialize(detail, JsonOptions),
            IpAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            CreatedAt = DateTimeOffset.UtcNow.ToString("O")
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>直近の監査ログを管理画面向けに返します。</summary>
    public async Task<IReadOnlyList<AuditLogDto>> ListAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var normalizedLimit = Math.Clamp(limit, 1, 500);
        return await db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(log => log.CreatedAt)
            .Take(normalizedLimit)
            .Select(log => new AuditLogDto(
                log.Id,
                log.UserId,
                log.UserName,
                log.Action,
                log.ScopeType,
                log.ScopeId,
                log.TargetType,
                log.TargetId,
                log.DetailJson,
                log.IpAddress,
                log.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
