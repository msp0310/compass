namespace Schedule.Api.Contracts;

/// <summary>TeamDtoのAPI入出力契約です。</summary>
public sealed record TeamDto(
    string Id,
    string Name,
    string Code,
    string Description,
    IReadOnlyList<string> MemberIds,
    IReadOnlyList<TeamMemberDto>? Memberships = null);
