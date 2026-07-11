namespace Schedule.Api.Contracts;

/// <summary>AuthUserDtoのAPI入出力契約です。</summary>
public sealed record AuthUserDto(
    string Id,
    string? MemberId,
    string Email,
    string Name,
    string Role);
