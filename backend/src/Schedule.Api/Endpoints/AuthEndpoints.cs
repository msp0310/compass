using Microsoft.AspNetCore.Http.HttpResults;
using Schedule.Api.Application;
using Schedule.Api.Contracts;
using System.Globalization;

namespace Schedule.Api.Endpoints;

/// <summary>認証とメンバーアカウント管理のHTTPエンドポイントを登録します。</summary>
public static class AuthEndpoints
{
    /// <summary>認証関連のMinimal APIルートを登録します。</summary>
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/auth");

        api.MapPost("/login", async (
            LoginRequest request,
            HttpContext context,
            AuthService auth,
            AuditLogService auditLogs,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var result = await auth.LoginAsync(request.Email, request.Password, cancellationToken);
            if (result is null) return Results.Unauthorized();
            var secure = !environment.IsDevelopment() || context.Request.IsHttps;
            context.Response.Cookies.Append(AuthService.SessionCookieName, result.SessionToken,
                new CookieOptions { HttpOnly = true, Secure = secure, SameSite = SameSiteMode.Strict, Expires = DateTimeOffset.Parse(result.Session.ExpiresAt, CultureInfo.InvariantCulture), Path = "/" });
            context.Response.Cookies.Append(AuthService.CsrfCookieName, result.CsrfToken,
                new CookieOptions { HttpOnly = false, Secure = secure, SameSite = SameSiteMode.Strict, Expires = DateTimeOffset.Parse(result.Session.ExpiresAt, CultureInfo.InvariantCulture), Path = "/" });
            await auditLogs.RecordAsync(
                result.Session.User,
                "auth.login",
                "system",
                null,
                "user",
                result.Session.User.Id,
                new { result.Session.User.Email },
                cancellationToken);
            return Results.Ok(result.Session);
        }).RequireRateLimiting("login");

        api.MapGet("/me", async Task<Results<Ok<AuthUserDto>, UnauthorizedHttpResult>> (
            HttpRequest request,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            var user = await auth.GetUserByTokenAsync(
                AuthService.GetSessionToken(request),
                cancellationToken);
            return user is null ? TypedResults.Unauthorized() : TypedResults.Ok(user);
        });

        api.MapPost("/logout", async (
            HttpRequest request,
            AuthService auth,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            var user = request.HttpContext.Items["CurrentUser"] as AuthUserDto;
            await auth.LogoutAsync(AuthService.GetSessionToken(request), cancellationToken);
            if (user is not null)
                await auditLogs.RecordAsync(user, "auth.logout", "system", null, "user", user.Id, null, cancellationToken);
            request.HttpContext.Response.Cookies.Delete(AuthService.SessionCookieName);
            request.HttpContext.Response.Cookies.Delete(AuthService.CsrfCookieName);
            return Results.NoContent();
        });

        api.MapPost("/change-password", async (
            HttpContext context,
            ChangePasswordRequest request,
            AuthService auth,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            try
            {
                if (!await auth.ChangePasswordAsync(user, request, cancellationToken))
                    return Results.BadRequest(new { message = "現在のパスワードが違います。" });
                await auditLogs.RecordAsync(user, "auth.password.change", "system", null, "user", user.Id, null, cancellationToken);
                context.Response.Cookies.Delete(AuthService.SessionCookieName);
                context.Response.Cookies.Delete(AuthService.CsrfCookieName);
                return Results.NoContent();
            }
            catch (ArgumentException error) { return Results.BadRequest(new { message = error.Message }); }
        });

        api.MapGet("/members", async (
            HttpContext context,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(context))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            return Results.Ok(await auth.ListMembersWithAccountsAsync(cancellationToken));
        });

        api.MapPut("/members/{memberId}/account", async (
            string memberId,
            HttpContext context,
            SaveMemberAccountRequest request,
            AuthService auth,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(context))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            var result = await auth.SaveMemberAccountAsync(memberId, request, cancellationToken);
            if (!result.IsNotFound && result.ConflictMessage is null &&
                context.Items["CurrentUser"] is AuthUserDto user)
                await auditLogs.RecordAsync(user, "member.account.save", "system", null, "member", memberId, new { request.Email, request.PermissionRole, request.LoginEnabled }, cancellationToken);
            return ToMemberMutationResponse(result);
        });

        api.MapPost("/members/{memberId}/reset-password", async (
            string memberId,
            HttpContext context,
            ResetPasswordRequest request,
            AuthService auth,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(context))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            var result = await auth.ResetMemberPasswordAsync(memberId, request, cancellationToken);
            if (!result.IsNotFound && result.ConflictMessage is null &&
                context.Items["CurrentUser"] is AuthUserDto user)
                await auditLogs.RecordAsync(user, "member.password.reset", "system", null, "member", memberId, new { request.PasswordResetRequired }, cancellationToken);
            return ToMemberMutationResponse(result);
        });

        return api;
    }

    private static bool IsAdmin(HttpContext context)
    {
        return context.Items["CurrentUser"] is AuthUserDto user &&
            string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase);
    }

    private static IResult ToMemberMutationResponse(MemberAccountMutationResult result)
    {
        if (result.IsNotFound)
        {
            return Results.NotFound();
        }

        if (result.ConflictMessage is not null)
        {
            return Results.Conflict(new { message = result.ConflictMessage });
        }

        return Results.Ok(new MemberAccountMutationResponse(
            result.Member!,
            result.TemporaryPassword));
    }
}
