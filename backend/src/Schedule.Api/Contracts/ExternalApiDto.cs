namespace Schedule.Api.Contracts;

/// <summary>外部APIクライアントが利用できる版とスコープを返します。</summary>
public sealed record ExternalApiInfoDto(
    string ApiVersion,
    string ClientId,
    string ClientName,
    IReadOnlyCollection<string> Scopes);

/// <summary>外部APIのページング済みレスポンスです。</summary>
public sealed record ExternalPageDto<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Offset,
    int Limit);

/// <summary>外部連携に必要な案件情報と集計だけを返します。</summary>
public sealed record ExternalProjectDto(
    string Id,
    string? ProjectNo,
    string? TeamId,
    string Name,
    string Workspace,
    string? LifecycleStatus,
    string RangeStart,
    string RangeEnd,
    string NextMilestoneTitle,
    string NextMilestoneDate,
    int Version,
    int TaskCount,
    int CompletedTaskCount,
    int DelayedTaskCount,
    int Progress,
    int MemberCount);

/// <summary>案件バージョンとタスク一覧を一緒に返します。</summary>
public sealed record ExternalTaskListDto(
    string ProjectId,
    int Version,
    IReadOnlyList<ScheduleTaskDto> Items);

/// <summary>外部連携からタスク計画を保存する入力です。</summary>
public sealed record ExternalTaskPlanRequestDto(
    IReadOnlyList<ScheduleTaskDto> Tasks,
    string? ChangeReason,
    int? ExpectedVersion);

/// <summary>タスク計画保存後の案件バージョンとタスク一覧です。</summary>
public sealed record ExternalTaskPlanResponseDto(
    string ProjectId,
    int Version,
    string SavedAt,
    IReadOnlyList<ScheduleTaskDto> Tasks);

/// <summary>外部連携からタスク実績を更新する入力です。</summary>
public sealed record ExternalTaskActualRequestDto(
    string Status,
    int Progress,
    string? ActualStart,
    string? ActualEnd,
    int? ExpectedVersion);

/// <summary>実績更新後の案件バージョンと対象タスクです。</summary>
public sealed record ExternalTaskActualResponseDto(
    string ProjectId,
    int Version,
    ScheduleTaskDto Task);
