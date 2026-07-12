namespace Schedule.Api.Contracts;

/// <summary>日報から案件・タスクへ反映する作業実績です。</summary>
public sealed record DailyReportEntryDto(
    string Id,
    string ProjectId,
    string? TaskId,
    decimal Hours,
    string Category,
    string Summary,
    string? Note,
    string? WorkLogId = null,
    int? Progress = null,
    int? PreviousProgress = null,
    string? PreviousStatus = null,
    string? PreviousActualStart = null,
    string? PreviousActualEnd = null);
