namespace Schedule.Api.Contracts;

/// <summary>案件一覧の初期表示に必要なチームと軽量案件集計をまとめた契約です。</summary>
public sealed record WorkspaceSummaryDto(
    IReadOnlyList<TeamDto> Teams,
    IReadOnlyList<ProjectSummaryDto> Projects);
