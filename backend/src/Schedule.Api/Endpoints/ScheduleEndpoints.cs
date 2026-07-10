using Microsoft.AspNetCore.Http.HttpResults;
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

        api.MapGet("/workspace", async (
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            return Results.Ok(await schedules.GetWorkspaceAsync(cancellationToken));
        });

        api.MapGet("/workspace/summary", async (
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            return Results.Ok(await schedules.GetWorkspaceSummaryAsync(cancellationToken));
        });

        api.MapGet("/projects/summary", async (
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            return Results.Ok(await schedules.GetProjectSummariesAsync(cancellationToken));
        });

        api.MapGet("/projects/{projectId}/schedule", async Task<Results<Ok<ScheduleSnapshotDto>, NotFound>> (
            string projectId,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var schedule = await schedules.GetProjectScheduleAsync(projectId, cancellationToken);
            return schedule is null ? TypedResults.NotFound() : TypedResults.Ok(schedule);
        });

        api.MapPut("/projects/{projectId}/schedule", async Task<Results<Ok<SaveScheduleResponse>, NotFound, Conflict<object>, BadRequest<object>>> (
            string projectId,
            SaveScheduleRequest request,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var validationError = ScheduleRequestValidator.Validate(projectId, request);
            if (validationError is not null)
            {
                return TypedResults.BadRequest<object>(new { message = validationError });
            }

            try
            {
                var result = await schedules.SaveProjectScheduleAsync(projectId, request, cancellationToken);
                return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
            }
            catch (ScheduleConflictException conflict)
            {
                return TypedResults.Conflict<object>(new
                {
                    message = "Schedule has been updated by another save.",
                    currentVersion = conflict.CurrentVersion
                });
            }
        });

        api.MapGet("/projects/{projectId}/changes", async (
            string projectId,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            return Results.Ok(await schedules.GetChangeLogsAsync(projectId, cancellationToken));
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
}
