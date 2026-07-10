namespace Schedule.Api.Contracts;

/// <summary>SaveScheduleResponseのAPI入出力契約です。</summary>
public sealed record SaveScheduleResponse(
    string Mode,
    string Revision,
    string SavedAt,
    ScheduleSnapshotDto Schedule);
