namespace Schedule.Api.ExternalApi;

/// <summary>外部APIだけをAPIキーで認証し、画面用Cookie認証から分離します。</summary>
public sealed class ExternalApiAuthenticationMiddleware(RequestDelegate next)
{
    public const string ClientItemKey = "ExternalApiClient";
    public const string RoutePrefix = "/api/external";

    public async Task InvokeAsync(HttpContext context, ExternalApiAuthenticator authenticator)
    {
        if (!context.Request.Path.StartsWithSegments(RoutePrefix))
        {
            await next(context);
            return;
        }

        var client = authenticator.Authenticate(context.Request);
        if (client is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://httpstatuses.com/401",
                title = "APIキーを確認してください。",
                status = StatusCodes.Status401Unauthorized
            });
            return;
        }

        context.Items[ClientItemKey] = client;
        await next(context);
    }
}
