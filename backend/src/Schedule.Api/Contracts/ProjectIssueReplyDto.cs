namespace Schedule.Api.Contracts;

/// <summary>ProjectIssueReplyDtoのAPI入出力契約です。</summary>
public sealed record ProjectIssueReplyDto(
    string Id,
    string Body,
    string AuthorName,
    string? AuthorId,
    string CreatedAt,
    string? UpdatedAt);
