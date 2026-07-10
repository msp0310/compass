namespace Schedule.Api.Contracts;

/// <summary>TaskReferenceLinkDtoのAPI入出力契約です。</summary>
public sealed record TaskReferenceLinkDto(string Id, string Label, string Url, string CreatedAt);
