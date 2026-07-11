namespace Schedule.Api.Contracts;

/// <summary>チームメンバーとチーム内権限のAPI契約です。</summary>
public sealed record TeamMemberDto(
    string MemberId,
    string Role);
