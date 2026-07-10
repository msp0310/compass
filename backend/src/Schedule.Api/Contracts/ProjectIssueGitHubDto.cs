namespace Schedule.Api.Contracts;

/// <summary>ProjectIssueGitHubDtoのAPI入出力契約です。</summary>
public sealed record ProjectIssueGitHubDto(
    string? Repository,
    int? IssueNumber,
    string? Url,
    string? State,
    string? SyncStatus,
    string? LastSyncedAt);
