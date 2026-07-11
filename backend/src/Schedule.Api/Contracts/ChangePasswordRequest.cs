namespace Schedule.Api.Contracts;

/// <summary>ログイン中ユーザーが自分のパスワードを変更する入力です。</summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
