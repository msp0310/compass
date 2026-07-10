namespace Schedule.Api.Contracts;

/// <summary>LoginRequestのAPI入出力契約です。</summary>
public sealed record LoginRequest(
    string Email,
    string Password);
