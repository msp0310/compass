namespace Schedule.Api.Contracts;

/// <summary>AuthSessionDtoのAPI入出力契約です。</summary>
public sealed record AuthSessionDto(
    AuthUserDto User,
    string Token,
    string ExpiresAt);
