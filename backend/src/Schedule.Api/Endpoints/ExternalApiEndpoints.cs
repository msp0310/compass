using Microsoft.AspNetCore.Mvc;
using Schedule.Api.Application;
using Schedule.Api.Contracts;
using Schedule.Api.ExternalApi;

namespace Schedule.Api.Endpoints;

/// <summary>外部システム向けに版を固定したREST APIを登録します。</summary>
public static class ExternalApiEndpoints
{
    private const string ApiVersion = "v1";

    public static RouteGroupBuilder MapExternalApiEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup($"/api/external/{ApiVersion}")
            .WithTags("External API")
            .RequireRateLimiting("external-api");

        api.MapGet("/", (HttpContext context) =>
        {
            var client = GetClient(context);
            return Results.Ok(new ExternalApiInfoDto(ApiVersion, client.Id, client.Name, client.Scopes));
        })
        .WithName("ExternalGetApiInfo")
        .WithSummary("外部APIの接続情報を取得します。");

        api.MapGet("/projects", async (
            HttpContext context,
            ScheduleService schedules,
            [FromQuery] string? teamId,
            [FromQuery] string? lifecycleStatus,
            [FromQuery] string? query,
            [FromQuery] int offset = 0,
            [FromQuery] int limit = 100,
            CancellationToken cancellationToken = default) =>
        {
            var client = GetClient(context);
            var scopeError = RequireScope(client, ExternalApiScopes.ProjectsRead);
            if (scopeError is not null) return scopeError;

            var rows = await schedules.GetProjectSummariesAsync(client.ToSystemUser(), cancellationToken);
            var filtered = rows
                .Where(row => client.CanAccessProject(row.Project.Id))
                .Where(row => string.IsNullOrWhiteSpace(teamId) || row.Project.TeamId == teamId)
                .Where(row => string.IsNullOrWhiteSpace(lifecycleStatus) ||
                    string.Equals(row.Project.LifecycleStatus, lifecycleStatus, StringComparison.OrdinalIgnoreCase))
                .Where(row => MatchesQuery(row, query))
                .Select(ToExternalProject)
                .ToArray();
            var normalizedOffset = Math.Max(0, offset);
            var normalizedLimit = Math.Clamp(limit, 1, 500);
            return Results.Ok(new ExternalPageDto<ExternalProjectDto>(
                filtered.Skip(normalizedOffset).Take(normalizedLimit).ToArray(),
                filtered.Length,
                normalizedOffset,
                normalizedLimit));
        })
        .WithName("ExternalListProjects")
        .WithSummary("参照可能な案件をページングして取得します。");

        api.MapGet("/projects/{projectId}", async (
            string projectId,
            HttpContext context,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var client = GetClient(context);
            var accessError = ValidateProjectAccess(client, projectId, ExternalApiScopes.ProjectsRead);
            if (accessError is not null) return accessError;
            var snapshot = await schedules.GetProjectScheduleAsync(projectId, client.ToSystemUser(), cancellationToken);
            if (snapshot is null) return Results.NotFound();
            SetVersionHeaders(context, snapshot.Project.Version);
            return Results.Ok(ToExternalProject(snapshot));
        })
        .WithName("ExternalGetProject")
        .WithSummary("案件情報と集計を取得します。");

        api.MapGet("/projects/{projectId}/tasks", async (
            string projectId,
            HttpContext context,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var client = GetClient(context);
            var accessError = ValidateProjectAccess(client, projectId, ExternalApiScopes.TasksRead);
            if (accessError is not null) return accessError;
            var snapshot = await schedules.GetProjectScheduleAsync(projectId, client.ToSystemUser(), cancellationToken);
            if (snapshot is null) return Results.NotFound();
            SetVersionHeaders(context, snapshot.Project.Version);
            return Results.Ok(new ExternalTaskListDto(projectId, snapshot.Project.Version, snapshot.Tasks));
        })
        .WithName("ExternalGetProjectTasks")
        .WithSummary("案件のタスク計画を取得します。");

        api.MapPut("/projects/{projectId}/tasks", async (
            string projectId,
            HttpContext context,
            ExternalTaskPlanRequestDto request,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var client = GetClient(context);
            var accessError = ValidateProjectAccess(client, projectId, ExternalApiScopes.TasksWrite);
            if (accessError is not null) return accessError;
            var expectedVersion = ResolveExpectedVersion(context, request.ExpectedVersion);
            if (expectedVersion is null) return PreconditionRequired();
            var validationError = ScheduleRequestValidator.ValidateTasks(request.Tasks);
            if (validationError is not null) return Results.BadRequest(new { message = validationError });

            try
            {
                var result = await schedules.SaveTaskPlanAsync(
                    projectId,
                    new SaveTaskPlanRequest(request.Tasks, request.ChangeReason, expectedVersion),
                    client.ToSystemUser(),
                    cancellationToken);
                if (result is null) return Results.NotFound();
                var version = result.Schedule.Project.Version;
                SetVersionHeaders(context, version);
                return Results.Ok(new ExternalTaskPlanResponseDto(
                    projectId,
                    version,
                    result.SavedAt,
                    result.Schedule.Tasks));
            }
            catch (ScheduleConflictException conflict)
            {
                return Conflict(conflict.CurrentVersion);
            }
        })
        .WithName("ExternalReplaceProjectTasks")
        .WithSummary("案件設定を変えずにタスク計画を置き換えます。");

        api.MapPatch("/projects/{projectId}/tasks/{taskId}/actual", async (
            string projectId,
            string taskId,
            HttpContext context,
            ExternalTaskActualRequestDto request,
            ScheduleService schedules,
            CancellationToken cancellationToken) =>
        {
            var client = GetClient(context);
            var accessError = ValidateProjectAccess(client, projectId, ExternalApiScopes.ActualsWrite);
            if (accessError is not null) return accessError;
            var expectedVersion = ResolveExpectedVersion(context, request.ExpectedVersion);
            if (expectedVersion is null) return PreconditionRequired();

            try
            {
                var snapshot = await schedules.UpdateTaskActualAsync(
                    projectId,
                    taskId,
                    new UpdateTaskActualRequest(
                        request.Status,
                        request.Progress,
                        request.ActualStart,
                        request.ActualEnd,
                        expectedVersion),
                    client.ToSystemUser(),
                    cancellationToken);
                if (snapshot is null) return Results.NotFound();
                var task = snapshot.Tasks.FirstOrDefault(item => item.Id == taskId);
                if (task is null) return Results.NotFound();
                SetVersionHeaders(context, snapshot.Project.Version);
                return Results.Ok(new ExternalTaskActualResponseDto(
                    projectId,
                    snapshot.Project.Version,
                    task));
            }
            catch (ScheduleConflictException conflict)
            {
                return Conflict(conflict.CurrentVersion);
            }
            catch (ArgumentException error)
            {
                return Results.BadRequest(new { message = error.Message });
            }
        })
        .WithName("ExternalUpdateTaskActual")
        .WithSummary("計画を変えずにタスクの状態・進捗・実績日を更新します。");

        return api;
    }

    private static ExternalApiClient GetClient(HttpContext context) =>
        context.Items[ExternalApiAuthenticationMiddleware.ClientItemKey] as ExternalApiClient
        ?? throw new InvalidOperationException("External API client was not authenticated.");

    private static IResult? ValidateProjectAccess(ExternalApiClient client, string projectId, string scope)
    {
        var scopeError = RequireScope(client, scope);
        if (scopeError is not null) return scopeError;
        return client.CanAccessProject(projectId)
            ? null
            : Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "この案件は許可されていません。");
    }

    private static IResult? RequireScope(ExternalApiClient client, string scope) =>
        client.HasScope(scope)
            ? null
            : Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "APIキーに必要なスコープがありません。",
                extensions: new Dictionary<string, object?> { ["requiredScope"] = scope });

    private static int? ResolveExpectedVersion(HttpContext context, int? bodyVersion)
    {
        if (bodyVersion is not null) return bodyVersion;
        var value = context.Request.Headers.IfMatch.ToString().Trim();
        if (value.StartsWith('"') && value.EndsWith('"')) value = value[1..^1];
        const string prefix = "project-";
        return value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) &&
            int.TryParse(value[prefix.Length..], out var version)
                ? version
                : null;
    }

    private static IResult PreconditionRequired() => Results.Problem(
        statusCode: StatusCodes.Status428PreconditionRequired,
        title: "案件バージョンを指定してください。",
        detail: "If-Match: \"project-{version}\" または expectedVersion が必要です。");

    private static IResult Conflict(int currentVersion) => Results.Conflict(new
    {
        message = "案件が別の操作で更新されています。最新データを再取得してください。",
        currentVersion
    });

    private static void SetVersionHeaders(HttpContext context, int version)
    {
        context.Response.Headers.ETag = $"\"project-{version}\"";
        context.Response.Headers.CacheControl = "no-store";
    }

    private static bool MatchesQuery(ProjectSummaryDto row, string? query)
    {
        if (string.IsNullOrWhiteSpace(query)) return true;
        var value = query.Trim();
        return row.Project.Name.Contains(value, StringComparison.OrdinalIgnoreCase) ||
            row.Project.Workspace.Contains(value, StringComparison.OrdinalIgnoreCase) ||
            (row.Project.ProjectNo?.Contains(value, StringComparison.OrdinalIgnoreCase) ?? false);
    }

    private static ExternalProjectDto ToExternalProject(ProjectSummaryDto row) => new(
        row.Project.Id,
        row.Project.ProjectNo,
        row.Project.TeamId,
        row.Project.Name,
        row.Project.Workspace,
        row.Project.LifecycleStatus,
        row.Project.RangeStart,
        row.Project.RangeEnd,
        row.Project.NextMilestone.Title,
        row.Project.NextMilestone.Date,
        row.Project.Version,
        row.TaskCount,
        row.CompletedTaskCount,
        row.DelayedTaskCount,
        row.Progress,
        row.MemberCount);

    private static ExternalProjectDto ToExternalProject(ScheduleSnapshotDto snapshot)
    {
        var tasks = snapshot.Tasks.Where(task => task.Type == "task").ToArray();
        return new ExternalProjectDto(
            snapshot.Project.Id,
            snapshot.Project.ProjectNo,
            snapshot.Project.TeamId,
            snapshot.Project.Name,
            snapshot.Project.Workspace,
            snapshot.Project.LifecycleStatus,
            snapshot.Project.RangeStart,
            snapshot.Project.RangeEnd,
            snapshot.Project.NextMilestone.Title,
            snapshot.Project.NextMilestone.Date,
            snapshot.Project.Version,
            tasks.Length,
            tasks.Count(task => task.Status == "done"),
            tasks.Count(task => task.Status == "delayed"),
            tasks.Length == 0 ? 0 : Convert.ToInt32(Math.Round(tasks.Average(task => task.Progress))),
            snapshot.Project.MemberIds?.Count ?? 0);
    }
}
