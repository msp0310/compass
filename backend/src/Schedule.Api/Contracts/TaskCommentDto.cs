namespace Schedule.Api.Contracts;

/// <summary>TaskCommentDtoのAPI入出力契約です。</summary>
public sealed record TaskCommentDto(string Id, string Author, string Body, string CreatedAt);
