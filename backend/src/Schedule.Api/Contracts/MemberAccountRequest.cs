namespace Schedule.Api.Contracts;

/// <summary>SaveMemberAccountRequestのAPI入出力契約です。</summary>
public sealed record SaveMemberAccountRequest(
    string Email,
    string PermissionRole,
    bool LoginEnabled,
    string? Password);

public sealed record MemberAccountMutationResponse(
    MemberDto Member,
    string? TemporaryPassword);
