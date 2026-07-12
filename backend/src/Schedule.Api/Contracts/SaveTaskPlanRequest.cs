namespace Schedule.Api.Contracts;

/// <summary>案件設定や実績を上書きせず、タスク計画だけを保存する契約です。</summary>
public sealed record SaveTaskPlanRequest(
    IReadOnlyList<ScheduleTaskDto> Tasks,
    string? ChangeReason,
    int? ExpectedVersion);
