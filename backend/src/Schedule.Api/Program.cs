using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Application;
using Schedule.Api.Endpoints;
using Schedule.Api.Infrastructure;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using System.Text;
using System.Threading.RateLimiting;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddRateLimiter(options =>
{
    var loginPermitLimit = builder.Environment.IsDevelopment() ? 1000 : 5;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = loginPermitLimit,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1)
        }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<ZstdCompressionProvider>();
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:5173",
                "http://localhost:5173",
                "http://127.0.0.1:5174",
                "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("ScheduleDb")
    ?? "Data Source=schedule-manager.db";
builder.Services.AddDbContext<ScheduleDbContext>(options =>
    options.UseSqlite(connectionString));
builder.Services.AddHttpClient<JapaneseHolidayService>(client =>
{
    // 外部の祝日APIが応答しない場合に、アプリ全体の操作を待たせません。
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProjectAuthorizationService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<AdministrationService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<AttachmentService>();
builder.Services.AddScoped<DailyReportService>();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024;
});

var app = builder.Build();

// 予期しない例外の詳細を外部へ返さず、一定形式のエラーに変換します。
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        ApiLog.UnhandledApiException(app.Logger, exception, context.Request.Path.ToString());
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new
        {
            message = "サーバーで予期しないエラーが発生しました。"
        });
    });
});

// Dockerの本番イメージでは、Viteで生成した画面をAPIと同じホストから配信します。
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend");
app.UseRateLimiter();
app.UseResponseCompression();
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
        context.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
        context.Response.Headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        context.Response.Headers.TryAdd("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://127.0.0.1:5080 http://localhost:5080");
        return Task.CompletedTask;
    });
    await next();
});
app.Use(async (context, next) =>
{
    if (!RequiresAuthentication(context.Request))
    {
        await next();
        return;
    }

    var auth = context.RequestServices.GetRequiredService<AuthService>();
    var user = await auth.GetUserByTokenAsync(
        AuthService.GetSessionToken(context.Request),
        context.RequestAborted);
    if (user is null)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new
        {
            message = "ログインが必要です。"
        });
        return;
    }

    context.Items["CurrentUser"] = user;
    if (user.PasswordResetRequired &&
        !context.Request.Path.Equals("/api/auth/me", StringComparison.OrdinalIgnoreCase) &&
        !context.Request.Path.Equals("/api/auth/logout", StringComparison.OrdinalIgnoreCase) &&
        !context.Request.Path.Equals("/api/auth/change-password", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { message = "パスワードの変更が必要です。", code = "password_reset_required" });
        return;
    }
    if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) &&
        !context.Request.Path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase))
    {
        var csrfCookie = context.Request.Cookies[AuthService.CsrfCookieName];
        var csrfHeader = context.Request.Headers["X-CSRF-Token"].ToString();
        if (string.IsNullOrWhiteSpace(csrfCookie) || !CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(csrfCookie), Encoding.UTF8.GetBytes(csrfHeader)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { message = "CSRF検証に失敗しました。" });
            return;
        }
    }
    await next();
});
app.MapAuthEndpoints();
app.MapScheduleEndpoints();
app.MapDailyReportEndpoints();
app.MapAdministrationEndpoints();
// TanStack Routerの直接アクセスでも、Viteで生成したSPAの入口を返します。
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ScheduleDbContext>();
    var seedDevelopmentData = app.Environment.IsDevelopment() ||
        app.Configuration.GetValue<bool>("Schedule:SeedDevelopmentData");
    await SeedData.EnsureSeededAsync(
        db,
        seedDevelopmentData,
        app.Configuration["Schedule:InitialAdminEmail"],
        app.Configuration["Schedule:InitialAdminPassword"],
        app.Configuration["Schedule:InitialAdminName"],
        CancellationToken.None);
}

app.Run();

static bool RequiresAuthentication(HttpRequest request)
{
    if (!request.Path.StartsWithSegments("/api"))
    {
        return false;
    }

    if (HttpMethods.IsOptions(request.Method))
    {
        return false;
    }

    if (request.Path.Equals("/api/health", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    if (request.Path.Equals("/api/health/ready", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    if (request.Path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    return true;
}

/// <summary>APIの予期しない例外を構造化ログへ記録します。</summary>
internal static partial class ApiLog
{
    [LoggerMessage(
        EventId = 500,
        Level = LogLevel.Error,
        Message = "Unhandled API exception: {Path}")]
    public static partial void UnhandledApiException(ILogger logger, Exception? exception, string path);
}
