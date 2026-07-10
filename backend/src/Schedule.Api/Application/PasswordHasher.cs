using System.Globalization;
using System.Security.Cryptography;

namespace Schedule.Api.Application;

/// <summary>PBKDF2-SHA256によるパスワードハッシュの生成と検証を担当します。</summary>
public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;
    private const string Algorithm = "pbkdf2-sha256";

    /// <summary>ランダムソルトを使ってパスワードをハッシュ化します。</summary>
    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return string.Join(
            ":",
            Algorithm,
            Iterations.ToString(CultureInfo.InvariantCulture),
            Base64UrlEncode(salt),
            Base64UrlEncode(hash));
    }

    /// <summary>保存済みハッシュと入力パスワードを一定時間比較します。</summary>
    public static bool VerifyPassword(string password, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 4 || parts[0] != Algorithm)
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        try
        {
            var salt = Base64UrlDecode(parts[2]);
            var expectedHash = Base64UrlDecode(parts[3]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    /// <summary>ハッシュ保存用にバイト列をURL安全なBase64へ変換します。</summary>
    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    /// <summary>URL安全なBase64文字列をバイト列へ戻します。</summary>
    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }
}
