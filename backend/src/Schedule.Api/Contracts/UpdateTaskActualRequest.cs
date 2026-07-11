namespace Schedule.Api.Contracts;

/// <summary>計画を変更せず、担当タスクの実績だけを更新する入力です。</summary>
public sealed record UpdateTaskActualRequest(
    string Status,
    int Progress,
    string? ActualStart,
    string? ActualEnd,
    int? ExpectedProjectVersion);
