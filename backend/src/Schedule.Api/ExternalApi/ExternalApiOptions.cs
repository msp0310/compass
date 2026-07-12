namespace Schedule.Api.ExternalApi;

/// <summary>外部REST APIの有効化、流量、接続クライアントを定義します。</summary>
public sealed class ExternalApiOptions
{
    public const string SectionName = "ExternalApi";

    public bool Enabled { get; init; }
    public int PermitLimitPerMinute { get; init; } = 120;
    public IReadOnlyList<ExternalApiClientOptions> Clients { get; init; } = [];
}

/// <summary>ハッシュ化したAPIキーと許可範囲を持つ外部クライアント設定です。</summary>
public sealed class ExternalApiClientOptions
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string KeyHash { get; init; } = "";
    public bool Enabled { get; init; } = true;
    public IReadOnlyList<string> Scopes { get; init; } = [];
    public IReadOnlyList<string> ProjectIds { get; init; } = [];
}
