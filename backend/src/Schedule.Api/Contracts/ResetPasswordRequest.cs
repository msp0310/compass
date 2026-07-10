namespace Schedule.Api.Contracts;

/// <summary>ResetPasswordRequestのAPI入出力契約です。</summary>
public sealed record ResetPasswordRequest(
    string? Password,
    bool PasswordResetRequired);
