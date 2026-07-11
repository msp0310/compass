namespace Schedule.Api.Contracts;

/// <summary>SaveScheduleRequestのAPI入出力契約です。</summary>
public sealed record SaveScheduleRequest(
    CalendarDefinitionDto Calendar,
    IReadOnlyList<ProjectIssueDto>? Issues,
    IReadOnlyList<MemberDto> Members,
    ProjectDto Project,
    IReadOnlyList<ScheduleTaskDto> Tasks,
    IReadOnlyList<ProjectWorkLogDto>? WorkLogs,
    string? ChangeReason,
    int? ExpectedVersion);
