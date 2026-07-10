namespace Schedule.Api.Contracts;

/// <summary>ProjectIssueDtoのAPI入出力契約です。</summary>
public sealed record ProjectIssueDto(
    string Id,
    string Title,
    string Body,
    string Status,
    string Priority,
    string Type,
    IReadOnlyList<string> AssigneeIds,
    IReadOnlyList<string> TaskIds,
    string? DueDate,
    string CreatedAt,
    string UpdatedAt,
    string? ClosedAt,
    IReadOnlyList<ProjectIssueReplyDto> Replies,
    ProjectIssueGitHubDto? Github);
