namespace Schedule.Api.Contracts;

/// <summary>TaskChecklistItemDtoのAPI入出力契約です。</summary>
public sealed record TaskChecklistItemDto(string Id, string Label, bool Done);
