using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Schedule.Api.Application;
using Schedule.Api.Contracts;

namespace Schedule.Api.Endpoints;

/// <summary>ワークスペース、プロジェクトスケジュール、休日のHTTPルートを登録します。</summary>
public static class ScheduleEndpoints
{
    /// <summary>スケジュール関連のMinimal APIルートを登録します。</summary>
    public static RouteGroupBuilder MapScheduleEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/health", () => Results.Ok(new
        {
            status = "ok",
            service = "Schedule.Api",
            checkedAt = DateTimeOffset.UtcNow
        }));

        api.MapGet("/health/ready", async (
            Schedule.Api.Infrastructure.ScheduleDbContext db,
            CancellationToken cancellationToken) =>
        {
            var connected = await db.Database.CanConnectAsync(cancellationToken);
            return connected
                ? Results.Ok(new { status = "ready", checkedAt = DateTimeOffset.UtcNow })
                : Results.Json(new { status = "not-ready" }, statusCode: StatusCodes.Status503ServiceUnavailable);
        });

        api.MapGet("/workspace/summary", async (
            HttpContext context,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            return user is null
                ? Results.Unauthorized()
                : Results.Ok(await schedules.GetWorkspaceSummaryAsync(user, cancellationToken));
        });

        api.MapGet("/projects/summary", async (
            HttpContext context,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            return user is null
                ? Results.Unauthorized()
                : Results.Ok(await schedules.GetProjectSummariesAsync(user, cancellationToken));
        });

        api.MapGet("/projects/{projectId}/schedule", async (
            string projectId,
            HttpContext context,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            try
            {
                var schedule = await schedules.GetProjectScheduleAsync(projectId, user, cancellationToken);
                return schedule is null ? Results.NotFound() : Results.Ok(schedule);
            }
            catch (ProjectAccessDeniedException)
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }
        });

        api.MapPut("/projects/{projectId}/schedule", async (
            string projectId,
            HttpContext context,
            SaveScheduleRequest request,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var validationError = ScheduleRequestValidator.Validate(projectId, request);
            if (validationError is not null)
            {
                return Results.BadRequest(new { message = validationError });
            }

            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            try
            {
                var result = await schedules.SaveProjectScheduleAsync(
                    projectId,
                    request,
                    user,
                    cancellationToken);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (ScheduleConflictException conflict)
            {
                return Results.Conflict(new
                {
                    message = "Schedule has been updated by another save.",
                    currentVersion = conflict.CurrentVersion
                });
            }
            catch (ProjectAccessDeniedException)
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }
        });

        api.MapPatch("/projects/{projectId}/tasks/{taskId}/actual", async (
            string projectId,
            string taskId,
            HttpContext context,
            UpdateTaskActualRequest request,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            try
            {
                var snapshot = await schedules.UpdateTaskActualAsync(
                    projectId,
                    taskId,
                    request,
                    user,
                    cancellationToken);
                return snapshot is null ? Results.NotFound() : Results.Ok(snapshot);
            }
            catch (ScheduleConflictException conflict)
            {
                return Results.Conflict(new { message = "プロジェクトが更新されています。", currentVersion = conflict.CurrentVersion });
            }
            catch (ArgumentException error)
            {
                return Results.BadRequest(new { message = error.Message });
            }
            catch (ProjectAccessDeniedException)
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }
        });

        api.MapGet("/projects/{projectId}/changes", async (
            string projectId,
            HttpContext context,
            ProjectAuthorizationService authorization,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            var access = await authorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanView) return Results.StatusCode(StatusCodes.Status403Forbidden);
            return Results.Ok(await schedules.GetChangeLogsAsync(projectId, cancellationToken));
        });

        api.MapGet("/projects/{projectId}/attachments", async (
            string projectId,
            HttpContext context,
            ProjectAuthorizationService authorization,
            AttachmentService attachments,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            var access = await authorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanView) return Results.StatusCode(StatusCodes.Status403Forbidden);
            return Results.Ok(await attachments.ListAsync(projectId, cancellationToken));
        });

        api.MapPost("/projects/{projectId}/attachments", async (
            string projectId,
            HttpContext context,
            [FromForm] string ownerType,
            [FromForm] string ownerId,
            [FromForm] string? parentId,
            [FromForm] IFormFile? file,
            ProjectAuthorizationService authorization,
            AttachmentService attachments,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user)
            {
                return Results.Unauthorized();
            }
            var access = await authorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanComment) return Results.StatusCode(StatusCodes.Status403Forbidden);

            var result = await attachments.UploadAsync(
                projectId,
                ownerType,
                ownerId,
                parentId,
                file,
                user,
                cancellationToken);
            if (result.Attachment is not null)
                await auditLogs.RecordAsync(
                    user,
                    "attachment.upload",
                    "project",
                    projectId,
                    ownerType,
                    ownerId,
                    new { result.Attachment.Id, result.Attachment.FileName, result.Attachment.SizeBytes },
                    cancellationToken);
            return result.StatusCode switch
            {
                StatusCodes.Status404NotFound => Results.NotFound(),
                StatusCodes.Status400BadRequest => Results.BadRequest(new { message = result.Error }),
                _ => Results.Ok(result.Attachment)
            };
        })
        .DisableAntiforgery();

        api.MapGet("/projects/{projectId}/attachments/{attachmentId}/download", async (
            string projectId,
            string attachmentId,
            HttpContext context,
            ProjectAuthorizationService authorization,
            AttachmentService attachments,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            var access = await authorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanView) return Results.StatusCode(StatusCodes.Status403Forbidden);
            var download = await attachments.OpenDownloadAsync(projectId, attachmentId, cancellationToken);
            return download is null
                ? Results.NotFound()
                : Results.File(
                    download.Stream,
                    download.ContentType,
                    download.FileName,
                    enableRangeProcessing: true,
                    lastModified: null,
                    entityTag: null);
        });

        api.MapDelete("/projects/{projectId}/attachments/{attachmentId}", async (
            string projectId,
            string attachmentId,
            HttpContext context,
            ProjectAuthorizationService authorization,
            AttachmentService attachments,
            AuditLogService auditLogs,
            CancellationToken cancellationToken) =>
        {
            var user = GetCurrentUser(context);
            if (user is null) return Results.Unauthorized();
            var access = await authorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanComment) return Results.StatusCode(StatusCodes.Status403Forbidden);
            try
            {
                var deleted = await attachments.DeleteAsync(
                    projectId,
                    attachmentId,
                    user,
                    access.CanEditPlan || access.CanManageProject,
                    cancellationToken);
                if (deleted)
                    await auditLogs.RecordAsync(
                        user,
                        "attachment.delete",
                        "project",
                        projectId,
                        "attachment",
                        attachmentId,
                        null,
                        cancellationToken);
                return deleted ? Results.NoContent() : Results.NotFound();
            }
            catch (UnauthorizedAccessException) { return Results.StatusCode(StatusCodes.Status403Forbidden); }
        });

        api.MapGet("/holidays/japan", async (
            DateOnly? from,
            DateOnly? to,
            JapaneseHolidayService holidays,
            CancellationToken cancellationToken) =>
        {
            return Results.Ok(await holidays.GetHolidaysAsync(from, to, cancellationToken));
        });

        return api;
    }

    private static AuthUserDto? GetCurrentUser(HttpContext context)
    {
        return context.Items["CurrentUser"] as AuthUserDto;
    }
}
