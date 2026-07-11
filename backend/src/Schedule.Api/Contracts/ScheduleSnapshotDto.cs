namespace Schedule.Api.Contracts;

/// <summary>ScheduleSnapshotDtoのAPI入出力契約です。</summary>
public sealed record ScheduleSnapshotDto(
    CalendarDefinitionDto Calendar,
    IReadOnlyList<ProjectIssueDto> Issues,
    IReadOnlyList<MemberDto> Members,
    ProjectDto Project,
    IReadOnlyList<ScheduleTaskDto> Tasks,
    IReadOnlyList<ProjectWorkLogDto> WorkLogs,
    ProjectAccessDto? Access = null);
