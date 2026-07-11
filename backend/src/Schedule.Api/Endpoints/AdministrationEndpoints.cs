using Schedule.Api.Application;
using Schedule.Api.Contracts;

namespace Schedule.Api.Endpoints;

/// <summary>管理マスター・案件作成・監査ログのルートを登録します。</summary>
public static class AdministrationEndpoints
{
    public static IEndpointRouteBuilder MapAdministrationEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");
        api.MapPut("/admin/teams/{teamId}", async (string teamId, TeamDto dto, HttpContext context,
            AdministrationService service, CancellationToken token) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            if (teamId != dto.Id) return Results.BadRequest(new { message = "チームIDが一致しません。" });
            try { return Results.Ok(await service.SaveTeamAsync(dto, user, token)); }
            catch (ProjectAccessDeniedException) { return Results.StatusCode(StatusCodes.Status403Forbidden); }
            catch (ArgumentException error) { return Results.BadRequest(new { message = error.Message }); }
        });
        api.MapPut("/admin/members/{memberId}", async (string memberId, MemberDto dto, HttpContext context,
            AdministrationService service, CancellationToken token) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            if (memberId != dto.Id) return Results.BadRequest(new { message = "メンバーIDが一致しません。" });
            try { return Results.Ok(await service.SaveMemberAsync(dto, user, token)); }
            catch (ProjectAccessDeniedException) { return Results.StatusCode(StatusCodes.Status403Forbidden); }
            catch (ArgumentException error) { return Results.BadRequest(new { message = error.Message }); }
        });
        api.MapPut("/admin/teams/{teamId}/calendar", async (string teamId, CalendarDefinitionDto dto, HttpContext context,
            AdministrationService service, CancellationToken token) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            try { return Results.Ok(await service.SaveTeamCalendarAsync(teamId, dto, user, token)); }
            catch (ProjectAccessDeniedException) { return Results.StatusCode(StatusCodes.Status403Forbidden); }
        });
        api.MapPost("/projects", async (SaveScheduleRequest request, HttpContext context,
            AdministrationService service, CancellationToken token) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            var validation = ScheduleRequestValidator.Validate(request.Project.Id, request);
            if (validation is not null) return Results.BadRequest(new { message = validation });
            try { return Results.Created($"/api/projects/{request.Project.Id}/schedule", await service.CreateProjectAsync(request, user, token)); }
            catch (ProjectAccessDeniedException) { return Results.StatusCode(StatusCodes.Status403Forbidden); }
            catch (InvalidOperationException error) { return Results.Conflict(new { message = error.Message }); }
        });
        api.MapGet("/admin/audit-logs", async (int? limit, HttpContext context, AuditLogService logs, CancellationToken token) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user || user.Role != SystemRoles.Admin)
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            return Results.Ok(await logs.ListAsync(limit ?? 100, token));
        });
        return app;
    }
}
