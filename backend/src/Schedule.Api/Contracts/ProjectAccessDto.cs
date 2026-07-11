namespace Schedule.Api.Contracts;

/// <summary>現在の利用者が案件で実行できる操作を表します。</summary>
public sealed record ProjectAccessDto(
    string Role,
    bool CanView,
    bool CanEditPlan,
    bool CanManageProject,
    bool CanManageStaffing,
    bool CanEnterActual,
    bool CanComment,
    bool CanApproveBaseline);
