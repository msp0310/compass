namespace Schedule.Api.Contracts;

/// <summary>案件メンバーと案件内権限のAPI契約です。</summary>
public sealed record ProjectMemberDto(
    string MemberId,
    string Role);
