using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Schedule.Api.Contracts;
using Schedule.Api.Domain;
using Schedule.Api.Infrastructure;

namespace Schedule.Api.Application;

/// <summary>日報と案件別作業実績を同一トランザクションで保存します。</summary>
public sealed class DailyReportService(
    ScheduleDbContext db,
    ProjectAuthorizationService projectAuthorization)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<DailyReportDto>> ListAsync(
        AuthUserDto user,
        string? teamId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = db.DailyReports.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(teamId))
        {
            if (!await CanViewTeamAsync(user, teamId, cancellationToken))
            {
                return [];
            }
            var memberIds = db.TeamMembers
                .Where(item => item.TeamId == teamId)
                .Select(item => item.MemberId);
            query = query.Where(report => memberIds.Contains(report.MemberId));
        }
        else if (!IsSystemAdmin(user))
        {
            if (string.IsNullOrWhiteSpace(user.MemberId)) return [];
            query = query.Where(report => report.MemberId == user.MemberId);
        }

        var reports = await query
            .AsNoTracking()
            .OrderByDescending(report => report.Date)
            .ThenBy(report => report.MemberId)
            .Skip((Math.Max(1, page) - 1) * Math.Clamp(pageSize, 1, 200))
            .Take(Math.Clamp(pageSize, 1, 200))
            .ToListAsync(cancellationToken);
        var reportIds = reports.Select(report => report.Id).ToArray();
        var reads = await db.DailyReportReads
            .AsNoTracking()
            .Where(read => read.UserId == user.Id && reportIds.Contains(read.ReportId))
            .ToDictionaryAsync(read => read.ReportId, read => read.CommentCount, cancellationToken);
        return reports.Select(report => ToDto(report, reads.GetValueOrDefault(report.Id))).ToArray();
    }

    public async Task<DailyReportDto?> SaveAsync(
        string reportId,
        SaveDailyReportRequest request,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        if (!CanEditMember(user, request.MemberId))
        {
            throw new UnauthorizedAccessException("この日報を編集する権限がありません。");
        }
        if (!await db.Members.AnyAsync(member => member.Id == request.MemberId, cancellationToken))
        {
            return null;
        }

        var projectIds = request.Entries.Select(entry => entry.ProjectId).Distinct().ToArray();
        var existingProjectIds = await db.Projects
            .Where(project => projectIds.Contains(project.Id))
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);
        if (existingProjectIds.Count != projectIds.Length)
        {
            throw new ArgumentException("日報のタスク実績に存在しないプロジェクトが含まれています。");
        }
        var accessByProjectId = new Dictionary<string, ProjectAccessDto>();
        foreach (var projectId in projectIds)
        {
            var access = await projectAuthorization.GetProjectAccessAsync(user, projectId, cancellationToken);
            if (!access.CanView)
            {
                throw new UnauthorizedAccessException("参照権限のないプロジェクトは日報へ登録できません。");
            }
            if (request.Status == "submitted" && !access.CanEnterActual)
            {
                throw new UnauthorizedAccessException("実績更新権限のないプロジェクトは日報へ提出できません。");
            }
            accessByProjectId[projectId] = access;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var report = await db.DailyReports.FirstOrDefaultAsync(item => item.Id == reportId, cancellationToken);
        var now = DateTimeOffset.UtcNow.ToString("O");
        var wasSubmitted = report?.Status == "submitted";
        var persistedEntries = report is null
            ? new Dictionary<string, DailyReportEntryDto>()
            : (JsonSerializer.Deserialize<IReadOnlyList<DailyReportEntryDto>>(
                report.EntriesJson,
                JsonOptions) ?? []).ToDictionary(entry => entry.Id);
        if (report is null)
        {
            report = new DailyReportEntity { Id = reportId, CreatedAt = now, Version = 1 };
            db.DailyReports.Add(report);
        }
        else
        {
            if (report.Version != request.Version)
            {
                throw new DailyReportConflictException(report.Version);
            }
            report.Version += 1;
        }

        var linkedLogs = await db.ProjectWorkLogs
            .Where(log => log.DailyReportId == reportId)
            .ToDictionaryAsync(log => log.DailyReportEntryId!, cancellationToken);
        var entryIds = request.Entries.Select(entry => entry.Id).ToHashSet();
        db.ProjectWorkLogs.RemoveRange(linkedLogs.Values.Where(log => !entryIds.Contains(log.DailyReportEntryId!)));

        if (wasSubmitted)
        {
            var currentEntryById = request.Entries.ToDictionary(entry => entry.Id);
            var entriesToRestore = persistedEntries.Values
                .Where(entry =>
                    request.Status != "submitted" ||
                    !currentEntryById.TryGetValue(entry.Id, out var currentEntry) ||
                    currentEntry.ProjectId != entry.ProjectId ||
                    currentEntry.TaskId != entry.TaskId)
                .ToArray();
            await RestoreTaskUpdatesAsync(reportId, entriesToRestore, cancellationToken);
        }

        var savedEntries = new List<DailyReportEntryDto>(request.Entries.Count);
        foreach (var entry in request.Entries)
        {
            var workLogId = entry.WorkLogId ?? $"daily-{reportId}-{entry.Id}";
            if (!linkedLogs.TryGetValue(entry.Id, out var log))
            {
                log = new ProjectWorkLogEntity
                {
                    Id = workLogId,
                    DailyReportId = reportId,
                    DailyReportEntryId = entry.Id,
                    CreatedAt = now,
                    CreatedBy = user.Name,
                    Billable = false
                };
                db.ProjectWorkLogs.Add(log);
            }
            log.ProjectId = entry.ProjectId;
            log.Date = request.Date;
            log.MemberId = request.MemberId;
            log.Hours = entry.Hours;
            log.Category = entry.Category;
            log.Summary = entry.Summary;
            log.Note = entry.Note;
            log.TaskId = entry.TaskId;
            log.UpdatedAt = now;
            savedEntries.Add(entry with { WorkLogId = workLogId });
        }

        if (request.Status == "submitted")
        {
            savedEntries = await ApplyTaskUpdatesAsync(
                reportId,
                request,
                user,
                accessByProjectId,
                persistedEntries,
                savedEntries,
                now,
                cancellationToken);
        }
        else
        {
            savedEntries = savedEntries.Select(ClearPreviousTaskActual).ToList();
        }

        report.MemberId = request.MemberId;
        report.Date = request.Date;
        report.Status = request.Status;
        report.Summary = request.Summary;
        report.Blockers = request.Blockers;
        report.NextPlan = request.NextPlan;
        report.EntriesJson = JsonSerializer.Serialize(savedEntries, JsonOptions);
        report.CommentsJson = JsonSerializer.Serialize(request.Comments, JsonOptions);
        report.SubmittedAt = request.Status == "submitted" ? report.SubmittedAt ?? now : null;
        report.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await MarkReadAsync(report.Id, user, cancellationToken);
        return ToDto(report, request.Comments.Count);
    }

    public async Task<DailyReportDto?> AddCommentAsync(
        string reportId,
        AddDailyReportCommentRequest request,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        var report = await db.DailyReports.FirstOrDefaultAsync(item => item.Id == reportId, cancellationToken);
        if (report is null || !await CanViewMemberAsync(user, report.MemberId, cancellationToken)) return null;
        var comments = JsonSerializer.Deserialize<List<DailyReportCommentDto>>(report.CommentsJson, JsonOptions) ?? [];
        comments.Add(new DailyReportCommentDto(
            $"daily-comment-{Guid.NewGuid():N}",
            user.Id,
            user.Name,
            request.Body.Trim(),
            DateTimeOffset.UtcNow.ToString("O")));
        report.CommentsJson = JsonSerializer.Serialize(comments, JsonOptions);
        report.UpdatedAt = DateTimeOffset.UtcNow.ToString("O");
        report.Version += 1;
        await db.SaveChangesAsync(cancellationToken);
        await MarkReadAsync(report.Id, user, cancellationToken);
        return ToDto(report, comments.Count);
    }

    public async Task<bool> MarkReadAsync(
        string reportId,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        var report = await db.DailyReports.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == reportId, cancellationToken);
        if (report is null || !await CanViewMemberAsync(user, report.MemberId, cancellationToken)) return false;
        var commentCount = JsonSerializer.Deserialize<IReadOnlyList<DailyReportCommentDto>>(
            report.CommentsJson,
            JsonOptions)?.Count ?? 0;
        var read = await db.DailyReportReads.FindAsync([reportId, user.Id], cancellationToken);
        if (read is null)
        {
            read = new DailyReportReadEntity { ReportId = reportId, UserId = user.Id };
            db.DailyReportReads.Add(read);
        }
        read.CommentCount = commentCount;
        read.ReadAt = DateTimeOffset.UtcNow.ToString("O");
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<DailyReportReminderDto>> SendRemindersAsync(
        SendDailyReportReminderRequest request,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        if (!await CanManageTeamAsync(user, request.TeamId, cancellationToken))
        {
            throw new UnauthorizedAccessException("リマインドを送信する権限がありません。");
        }
        var teamMemberIds = await db.TeamMembers
            .Where(item => item.TeamId == request.TeamId && request.MemberIds.Contains(item.MemberId))
            .Select(item => item.MemberId)
            .ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow.ToString("O");
        var reminders = teamMemberIds.Select(memberId => new DailyReportReminderEntity
        {
            Id = $"daily-reminder-{Guid.NewGuid():N}",
            TeamId = request.TeamId,
            Date = request.Date,
            RecipientMemberId = memberId,
            SenderUserId = user.Id,
            SenderName = user.Name,
            CreatedAt = now
        }).ToArray();
        db.DailyReportReminders.AddRange(reminders);
        await db.SaveChangesAsync(cancellationToken);
        return reminders.Select(ToDto).ToArray();
    }

    public async Task<IReadOnlyList<DailyReportReminderDto>> ListRemindersAsync(
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.MemberId)) return [];
        var reminders = await db.DailyReportReminders.AsNoTracking()
            .Where(item => item.RecipientMemberId == user.MemberId && item.ReadAt == null)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);
        return reminders.Select(ToDto).ToArray();
    }

    public async Task<bool> MarkReminderReadAsync(
        string reminderId,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.MemberId)) return false;
        var reminder = await db.DailyReportReminders.FirstOrDefaultAsync(
            item => item.Id == reminderId && item.RecipientMemberId == user.MemberId,
            cancellationToken);
        if (reminder is null) return false;
        reminder.ReadAt = DateTimeOffset.UtcNow.ToString("O");
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(
        string reportId,
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        var report = await db.DailyReports.FirstOrDefaultAsync(item => item.Id == reportId, cancellationToken);
        if (report is null) return false;
        if (!CanEditMember(user, report.MemberId))
        {
            throw new UnauthorizedAccessException("この日報を削除する権限がありません。");
        }
        var logs = await db.ProjectWorkLogs.Where(log => log.DailyReportId == reportId).ToListAsync(cancellationToken);
        var entries = JsonSerializer.Deserialize<IReadOnlyList<DailyReportEntryDto>>(
            report.EntriesJson,
            JsonOptions) ?? [];
        await RestoreTaskUpdatesAsync(reportId, entries, cancellationToken);
        db.ProjectWorkLogs.RemoveRange(logs);
        db.DailyReports.Remove(report);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<List<DailyReportEntryDto>> ApplyTaskUpdatesAsync(
        string reportId,
        SaveDailyReportRequest request,
        AuthUserDto user,
        Dictionary<string, ProjectAccessDto> accessByProjectId,
        Dictionary<string, DailyReportEntryDto> persistedEntries,
        List<DailyReportEntryDto> entries,
        string now,
        CancellationToken cancellationToken)
    {
        var taskIds = entries.Select(entry => entry.TaskId!).Distinct().ToArray();
        var projectIds = entries.Select(entry => entry.ProjectId).Distinct().ToArray();
        var tasks = await db.Tasks
            .Include(task => task.Assignments)
            .Where(task => projectIds.Contains(task.ProjectId))
            .ToListAsync(cancellationToken);
        var taskById = tasks.Where(task => taskIds.Contains(task.Id)).ToDictionary(task => task.Id);
        var projects = await db.Projects
            .Where(project => projectIds.Contains(project.Id))
            .ToDictionaryAsync(project => project.Id, cancellationToken);
        var authorName = await db.Members
            .Where(member => member.Id == request.MemberId)
            .Select(member => member.Name)
            .SingleAsync(cancellationToken);
        var touchedProjectIds = new HashSet<string>();
        var updatedEntries = new List<DailyReportEntryDto>(entries.Count);

        foreach (var entry in entries)
        {
            if (entry.TaskId is null || !taskById.TryGetValue(entry.TaskId, out var task) ||
                task.ProjectId != entry.ProjectId)
            {
                throw new ArgumentException("日報に存在しないタスクが含まれています。");
            }
            var access = accessByProjectId[entry.ProjectId];
            var unrestricted = access.Role is SystemRoles.Admin or ProjectRoles.Owner or ProjectRoles.Planner;
            if (!unrestricted && task.Assignments.All(item => item.MemberId != request.MemberId))
            {
                throw new UnauthorizedAccessException("担当していないタスクの実績は更新できません。");
            }

            persistedEntries.TryGetValue(entry.Id, out var persistedEntry);
            var samePersistedTask = persistedEntry?.ProjectId == entry.ProjectId &&
                persistedEntry.TaskId == entry.TaskId;
            var previousProgress = samePersistedTask
                ? entry.PreviousProgress ?? persistedEntry?.PreviousProgress ?? task.Progress
                : task.Progress;
            var previousStatus = samePersistedTask
                ? entry.PreviousStatus ?? persistedEntry?.PreviousStatus ?? task.Status
                : task.Status;
            var previousActualStart = samePersistedTask
                ? entry.PreviousActualStart ?? persistedEntry?.PreviousActualStart ?? task.ActualStart
                : task.ActualStart;
            var previousActualEnd = samePersistedTask
                ? entry.PreviousActualEnd ?? persistedEntry?.PreviousActualEnd ?? task.ActualEnd
                : task.ActualEnd;
            var progress = Math.Clamp(entry.Progress ?? task.Progress, 0, 100);

            task.Progress = progress;
            task.Status = StatusForProgress(progress, task.Status);
            if (progress > 0)
            {
                task.ActualStart ??= request.Date;
            }
            task.ActualEnd = progress == 100 ? request.Date : null;
            UpsertDailyReportComment(task, reportId, entry, authorName, request.Date, now);
            touchedProjectIds.Add(entry.ProjectId);
            updatedEntries.Add(entry with
            {
                Progress = progress,
                PreviousProgress = previousProgress,
                PreviousStatus = previousStatus,
                PreviousActualStart = previousActualStart,
                PreviousActualEnd = previousActualEnd
            });
        }

        foreach (var entry in updatedEntries)
        {
            var task = taskById[entry.TaskId!];
            RecalculateParentProgress(tasks.Where(item => item.ProjectId == task.ProjectId).ToArray(), task.ParentId);
        }
        foreach (var projectId in touchedProjectIds)
        {
            projects[projectId].Version += 1;
        }
        return updatedEntries;
    }

    private async Task RestoreTaskUpdatesAsync(
        string reportId,
        IReadOnlyList<DailyReportEntryDto> entries,
        CancellationToken cancellationToken)
    {
        var taskIds = entries.Where(entry => entry.TaskId is not null).Select(entry => entry.TaskId!).Distinct().ToArray();
        if (taskIds.Length == 0) return;
        var projectIds = entries.Select(entry => entry.ProjectId).Distinct().ToArray();
        var tasks = await db.Tasks
            .Where(task => projectIds.Contains(task.ProjectId))
            .ToListAsync(cancellationToken);
        var taskById = tasks.Where(task => taskIds.Contains(task.Id)).ToDictionary(task => task.Id);
        var touchedProjectIds = new HashSet<string>();

        foreach (var entry in entries)
        {
            if (entry.TaskId is null || !taskById.TryGetValue(entry.TaskId, out var task)) continue;
            var comments = ReadTaskComments(task);
            var removed = comments.RemoveAll(comment => comment.Id == DailyReportCommentId(reportId, entry.Id)) > 0;
            if (removed)
            {
                task.CommentsJson = JsonSerializer.Serialize(comments, JsonOptions);
                touchedProjectIds.Add(task.ProjectId);
            }
            if (entry.Progress is not null && entry.PreviousProgress is not null && task.Progress == entry.Progress)
            {
                task.Progress = entry.PreviousProgress.Value;
                task.Status = entry.PreviousStatus ?? StatusForProgress(task.Progress, task.Status);
                task.ActualStart = entry.PreviousActualStart;
                task.ActualEnd = entry.PreviousActualEnd;
                RecalculateParentProgress(tasks.Where(item => item.ProjectId == task.ProjectId).ToArray(), task.ParentId);
                touchedProjectIds.Add(task.ProjectId);
            }
        }

        var projects = await db.Projects
            .Where(project => touchedProjectIds.Contains(project.Id))
            .ToListAsync(cancellationToken);
        foreach (var project in projects)
        {
            project.Version += 1;
        }
    }

    private static void UpsertDailyReportComment(
        TaskEntity task,
        string reportId,
        DailyReportEntryDto entry,
        string authorName,
        string date,
        string now)
    {
        var comments = ReadTaskComments(task);
        var commentId = DailyReportCommentId(reportId, entry.Id);
        var existingIndex = comments.FindIndex(comment => comment.Id == commentId);
        var createdAt = existingIndex >= 0 ? comments[existingIndex].CreatedAt : now;
        var comment = new TaskCommentDto(
            commentId,
            authorName,
            $"日報 {date}\n{entry.Summary.Trim()}",
            createdAt);
        if (existingIndex >= 0)
        {
            comments[existingIndex] = comment;
        }
        else
        {
            comments.Insert(0, comment);
        }
        task.CommentsJson = JsonSerializer.Serialize(comments, JsonOptions);
    }

    private static List<TaskCommentDto> ReadTaskComments(TaskEntity task)
    {
        return JsonSerializer.Deserialize<List<TaskCommentDto>>(task.CommentsJson ?? "[]", JsonOptions) ?? [];
    }

    private static string DailyReportCommentId(string reportId, string entryId)
    {
        return $"daily-report-{reportId}-{entryId}";
    }

    private static string StatusForProgress(int progress, string currentStatus)
    {
        if (progress >= 100) return "done";
        if (progress <= 0) return "notStarted";
        return currentStatus == "delayed" ? "delayed" : "inProgress";
    }

    private static DailyReportEntryDto ClearPreviousTaskActual(DailyReportEntryDto entry)
    {
        return entry with
        {
            PreviousProgress = null,
            PreviousStatus = null,
            PreviousActualStart = null,
            PreviousActualEnd = null
        };
    }

    private static void RecalculateParentProgress(IReadOnlyList<TaskEntity> tasks, string? parentId)
    {
        while (!string.IsNullOrWhiteSpace(parentId))
        {
            var parent = tasks.FirstOrDefault(task => task.Id == parentId);
            if (parent is null) return;
            var children = tasks.Where(task => task.ParentId == parent.Id).ToArray();
            if (children.Length > 0)
            {
                parent.Progress = Convert.ToInt32(Math.Round(children.Average(child => child.Progress)));
                parent.Status = children.All(child => child.Status == "done")
                    ? "done"
                    : children.Any(child => child.Status is "inProgress" or "done" or "delayed")
                        ? "inProgress"
                        : "notStarted";
            }
            parentId = parent.ParentId;
        }
    }

    private static DailyReportDto ToDto(DailyReportEntity entity, int readCommentCount)
    {
        var comments = JsonSerializer.Deserialize<IReadOnlyList<DailyReportCommentDto>>(
            entity.CommentsJson,
            JsonOptions) ?? [];
        return new DailyReportDto(
            entity.Id,
            entity.MemberId,
            entity.Date,
            entity.Status,
            entity.Summary,
            entity.Blockers,
            entity.NextPlan,
            JsonSerializer.Deserialize<IReadOnlyList<DailyReportEntryDto>>(entity.EntriesJson, JsonOptions) ?? [],
            comments,
            entity.SubmittedAt,
            entity.CreatedAt,
            entity.UpdatedAt,
            entity.Version,
            Math.Max(0, comments.Count - readCommentCount));
    }

    private static DailyReportReminderDto ToDto(DailyReportReminderEntity entity) => new(
        entity.Id,
        entity.TeamId,
        entity.Date,
        entity.RecipientMemberId,
        entity.SenderName,
        entity.CreatedAt,
        entity.ReadAt);

    private static bool CanEditMember(AuthUserDto user, string memberId) =>
        user.MemberId == memberId || IsSystemAdmin(user);

    private async Task<bool> CanViewMemberAsync(
        AuthUserDto user,
        string memberId,
        CancellationToken cancellationToken)
    {
        if (user.MemberId == memberId || IsSystemAdmin(user)) return true;
        if (string.IsNullOrWhiteSpace(user.MemberId)) return false;
        return await db.TeamMembers.AnyAsync(
            own => own.MemberId == user.MemberId && db.TeamMembers.Any(
                target => target.TeamId == own.TeamId && target.MemberId == memberId),
            cancellationToken);
    }

    private async Task<bool> CanViewTeamAsync(
        AuthUserDto user,
        string teamId,
        CancellationToken cancellationToken) =>
        IsSystemAdmin(user) ||
        (!string.IsNullOrWhiteSpace(user.MemberId) && await db.TeamMembers.AnyAsync(
            item => item.TeamId == teamId && item.MemberId == user.MemberId,
            cancellationToken));

    private async Task<bool> CanManageTeamAsync(
        AuthUserDto user,
        string teamId,
        CancellationToken cancellationToken)
    {
        if (IsSystemAdmin(user)) return true;
        if (string.IsNullOrWhiteSpace(user.MemberId)) return false;
        return await db.TeamMembers.AnyAsync(
            item => item.TeamId == teamId && item.MemberId == user.MemberId &&
                item.TeamRole == TeamRoles.Manager,
            cancellationToken);
    }

    private static bool IsSystemAdmin(AuthUserDto user) =>
        user.Role.Equals(SystemRoles.Admin, StringComparison.OrdinalIgnoreCase);
}

public sealed class DailyReportConflictException(int currentVersion) : Exception
{
    public int CurrentVersion { get; } = currentVersion;
}
