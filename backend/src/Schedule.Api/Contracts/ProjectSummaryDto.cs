namespace Schedule.Api.Contracts;

/// <summary>案件一覧で使う軽量なプロジェクト集計契約です。</summary>
public sealed record ProjectSummaryDto(
    ProjectDto Project,
    int TaskCount,
    int CompletedTaskCount,
    int DelayedTaskCount,
    int Progress,
    int MemberCount,
    ProjectAccessDto? Access = null);
