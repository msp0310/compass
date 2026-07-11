using Microsoft.AspNetCore.ResponseCompression;
using ZstdSharp;

namespace Schedule.Api.Infrastructure;

/// <summary>HTTPレスポンスをZstandard形式で圧縮します。</summary>
public sealed class ZstdCompressionProvider : ICompressionProvider
{
    private const int CompressionLevel = 3;

    public string EncodingName => "zstd";

    public bool SupportsFlush => true;

    public Stream CreateStream(Stream outputStream) =>
        new CompressionStream(outputStream, CompressionLevel);
}
