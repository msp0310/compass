namespace Schedule.Api.Contracts;

/// <summary>ScheduleWorkspaceDtoのAPI入出力契約です。</summary>
public sealed record ScheduleWorkspaceDto(
    IReadOnlyList<TeamDto> Teams,
    IReadOnlyList<ScheduleSnapshotDto> Schedules);
