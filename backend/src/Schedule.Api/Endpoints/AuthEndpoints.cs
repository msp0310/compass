using Microsoft.AspNetCore.Http.HttpResults;
using Schedule.Api.Application;
using Schedule.Api.Contracts;

namespace Schedule.Api.Endpoints;

/// <summary>認証とメンバーアカウント管理のHTTPエンドポイントを登録します。</summary>
public static class AuthEndpoints
{
    /// <summary>認証関連のMinimal APIルートを登録します。</summary>
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/auth");

        api.MapPost("/login", async Task<Results<Ok<AuthSessionDto>, UnauthorizedHttpResult>> (
            LoginRequest request,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            var session = await auth.LoginAsync(request.Email, request.Password, cancellationToken);
            return session is null ? TypedResults.Unauthorized() : TypedResults.Ok(session);
        });

        api.MapGet("/me", async Task<Results<Ok<AuthUserDto>, UnauthorizedHttpResult>> (
            HttpRequest request,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            var user = await auth.GetUserByTokenAsync(
                AuthService.GetBearerToken(request),
                cancellationToken);
            return user is null ? TypedResults.Unauthorized() : TypedResults.Ok(user);
        });

        api.MapPost("/logout", async (
            HttpRequest request,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            await auth.LogoutAsync(AuthService.GetBearerToken(request), cancellationToken);
            return Results.NoContent();
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
            CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(context))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            var result = await auth.SaveMemberAccountAsync(memberId, request, cancellationToken);
            return ToMemberMutationResponse(result);
        });

        api.MapPost("/members/{memberId}/reset-password", async (
            string memberId,
            HttpContext context,
            ResetPasswordRequest request,
            AuthService auth,
            CancellationToken cancellationToken) =>
        {
            if (!IsAdmin(context))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            var result = await auth.ResetMemberPasswordAsync(memberId, request, cancellationToken);
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
