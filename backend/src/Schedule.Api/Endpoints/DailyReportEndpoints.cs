using Schedule.Api.Application;
using Schedule.Api.Contracts;

namespace Schedule.Api.Endpoints;

/// <summary>個人日報の取得・保存・削除ルートを登録します。</summary>
public static class DailyReportEndpoints
{
    public static IEndpointRouteBuilder MapDailyReportEndpoints(this IEndpointRouteBuilder app)
    {
        var reports = app.MapGroup("/api/daily-reports");
        reports.MapGet("/", async (
            string? teamId,
            int? page,
            int? pageSize,
            HttpContext context,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            return Results.Ok(await service.ListAsync(user, teamId, page ?? 1, pageSize ?? 100, cancellationToken));
        });

        reports.MapPut("/{reportId}", async (
            string reportId,
            HttpContext context,
            SaveDailyReportRequest request,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Summary) || request.Entries.Count == 0)
            {
                return Results.BadRequest(new { message = "日報のまとめと作業明細を入力してください。" });
            }
            try
            {
                var result = await service.SaveAsync(reportId, request, user, cancellationToken);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (ArgumentException error)
            {
                return Results.BadRequest(new { message = error.Message });
            }
            catch (DailyReportConflictException conflict)
            {
                return Results.Conflict(new { message = "日報が更新されています。", currentVersion = conflict.CurrentVersion });
            }
            catch (UnauthorizedAccessException error)
            {
                return Results.Json(new { message = error.Message }, statusCode: StatusCodes.Status403Forbidden);
            }
        });

        reports.MapPost("/{reportId}/comments", async (
            string reportId,
            HttpContext context,
            AddDailyReportCommentRequest request,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Body)) return Results.BadRequest();
            var report = await service.AddCommentAsync(reportId, request, user, cancellationToken);
            return report is null ? Results.NotFound() : Results.Ok(report);
        });

        reports.MapPost("/{reportId}/read", async (
            string reportId,
            HttpContext context,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            return await service.MarkReadAsync(reportId, user, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound();
        });

        reports.MapGet("/reminders", async (
            HttpContext context,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            return Results.Ok(await service.ListRemindersAsync(user, cancellationToken));
        });

        reports.MapPost("/reminders", async (
            HttpContext context,
            SendDailyReportReminderRequest request,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            try
            {
                return Results.Ok(await service.SendRemindersAsync(request, user, cancellationToken));
            }
            catch (UnauthorizedAccessException error)
            {
                return Results.Json(new { message = error.Message }, statusCode: StatusCodes.Status403Forbidden);
            }
        });

        reports.MapPost("/reminders/{reminderId}/read", async (
            string reminderId,
            HttpContext context,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            return await service.MarkReminderReadAsync(reminderId, user, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound();
        });

        reports.MapDelete("/{reportId}", async (
            string reportId,
            HttpContext context,
            DailyReportService service,
            CancellationToken cancellationToken) =>
        {
            if (context.Items["CurrentUser"] is not AuthUserDto user) return Results.Unauthorized();
            try
            {
                return await service.DeleteAsync(reportId, user, cancellationToken)
                    ? Results.NoContent()
                    : Results.NotFound();
            }
            catch (UnauthorizedAccessException error)
            {
                return Results.Json(new { message = error.Message }, statusCode: StatusCodes.Status403Forbidden);
            }
        });
        return app;
    }
}
