namespace Schedule.Api.Contracts;

/// <summary>管理画面で参照する監査ログのAPI契約です。</summary>
public sealed record AuditLogDto(
    string Id,
    string UserId,
    string UserName,
    string Action,
    string ScopeType,
    string? ScopeId,
    string? TargetType,
    string? TargetId,
    string? DetailJson,
    string? IpAddress,
    string CreatedAt);
