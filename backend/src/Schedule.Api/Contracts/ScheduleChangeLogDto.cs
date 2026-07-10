namespace Schedule.Api.Contracts;

/// <summary>ScheduleChangeLogDtoのAPI入出力契約です。</summary>
public sealed record ScheduleChangeLogDto(
    string Id,
    string ProjectId,
    string TaskId,
    string Field,
    string? BeforeValue,
    string? AfterValue,
    int? DeltaDays,
    string ChangedAt,
    string ChangedBy,
    string? Reason);
