using Microsoft.EntityFrameworkCore;
using Schedule.Api.Contracts;
using Schedule.Api.Infrastructure;

namespace Schedule.Api.Application;

/// <summary>システム・チーム・案件の三層ロールから案件操作権限を解決します。</summary>
public sealed class ProjectAuthorizationService(ScheduleDbContext db)
{
    private static readonly ProjectAccessDto NoAccess = new(
        ProjectRoles.Viewer,
        false,
        false,
        false,
        false,
        false,
        false,
        false);

    /// <summary>指定案件に対する現在ユーザーの権限を返します。</summary>
    public async Task<ProjectAccessDto> GetProjectAccessAsync(
        AuthUserDto user,
        string projectId,
        CancellationToken cancellationToken)
    {
        if (string.Equals(user.Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return FullAccess(SystemRoles.Admin);
        }

        if (string.IsNullOrWhiteSpace(user.MemberId))
        {
            return NoAccess;
        }

        var project = await db.Projects
            .AsNoTracking()
            .Where(entity => entity.Id == projectId)
            .Select(entity => new
            {
                entity.TeamId,
                ProjectRole = entity.Members
                    .Where(member => member.MemberId == user.MemberId)
                    .Select(member => member.ProjectRole)
                    .FirstOrDefault()
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (project is null)
        {
            return NoAccess;
        }

        var teamManager = project.TeamId is not null && await db.TeamMembers
            .AsNoTracking()
            .AnyAsync(
                member => member.TeamId == project.TeamId &&
                    member.MemberId == user.MemberId &&
                    member.TeamRole == TeamRoles.Manager,
                cancellationToken);

        return project.ProjectRole switch
        {
            ProjectRoles.Owner => FullAccess(ProjectRoles.Owner),
            ProjectRoles.Planner => new ProjectAccessDto(
                ProjectRoles.Planner,
                true,
                true,
                false,
                teamManager,
                true,
                true,
                false),
            ProjectRoles.Member => new ProjectAccessDto(
                ProjectRoles.Member,
                true,
                false,
                false,
                teamManager,
                true,
                true,
                false),
            ProjectRoles.Viewer => new ProjectAccessDto(
                ProjectRoles.Viewer,
                true,
                false,
                false,
                teamManager,
                false,
                false,
                false),
            _ when teamManager => new ProjectAccessDto(
                TeamRoles.Manager,
                true,
                false,
                false,
                true,
                false,
                false,
                false),
            _ => NoAccess
        };
    }

    /// <summary>案件一覧向けに複数案件の権限をまとめて解決します。</summary>
    public async Task<IReadOnlyDictionary<string, ProjectAccessDto>> GetProjectAccessMapAsync(
        AuthUserDto user,
        IReadOnlyDictionary<string, string?> projectTeamIds,
        CancellationToken cancellationToken)
    {
        if (string.Equals(user.Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return projectTeamIds.Keys.ToDictionary(id => id, _ => FullAccess(SystemRoles.Admin));
        }
        if (string.IsNullOrWhiteSpace(user.MemberId))
        {
            return projectTeamIds.Keys.ToDictionary(id => id, _ => NoAccess);
        }

        var projectIds = projectTeamIds.Keys.ToArray();
        var roles = await db.ProjectMembers
            .AsNoTracking()
            .Where(member => member.MemberId == user.MemberId && projectIds.Contains(member.ProjectId))
            .ToDictionaryAsync(member => member.ProjectId, member => member.ProjectRole, cancellationToken);
        var teamIds = projectTeamIds.Values.Where(id => id is not null).Cast<string>().Distinct().ToArray();
        var managerTeamIds = await db.TeamMembers
            .AsNoTracking()
            .Where(member => member.MemberId == user.MemberId &&
                             member.TeamRole == TeamRoles.Manager &&
                             teamIds.Contains(member.TeamId))
            .Select(member => member.TeamId)
            .ToHashSetAsync(cancellationToken);

        return projectTeamIds.ToDictionary(
            pair => pair.Key,
            pair => ResolveAccess(
                roles.GetValueOrDefault(pair.Key),
                pair.Value is not null && managerTeamIds.Contains(pair.Value)));
    }

    /// <summary>ユーザーが参照可能な案件IDを取得します。</summary>
    public async Task<IReadOnlySet<string>?> GetVisibleProjectIdsAsync(
        AuthUserDto user,
        CancellationToken cancellationToken)
    {
        if (string.Equals(user.Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(user.MemberId))
        {
            return new HashSet<string>(StringComparer.Ordinal);
        }

        var memberId = user.MemberId;
        var projectIds = await db.ProjectMembers
            .AsNoTracking()
            .Where(member => member.MemberId == memberId)
            .Select(member => member.ProjectId)
            .ToListAsync(cancellationToken);
        var managerTeamIds = await db.TeamMembers
            .AsNoTracking()
            .Where(member => member.MemberId == memberId && member.TeamRole == TeamRoles.Manager)
            .Select(member => member.TeamId)
            .ToListAsync(cancellationToken);
        if (managerTeamIds.Count > 0)
        {
            projectIds.AddRange(await db.Projects
                .AsNoTracking()
                .Where(project => project.TeamId != null && managerTeamIds.Contains(project.TeamId))
                .Select(project => project.Id)
                .ToListAsync(cancellationToken));
        }

        return projectIds.ToHashSet(StringComparer.Ordinal);
    }

    /// <summary>チームを参照できるか判定します。</summary>
    public async Task<bool> CanViewTeamAsync(
        AuthUserDto user,
        string teamId,
        CancellationToken cancellationToken)
    {
        if (string.Equals(user.Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase)) return true;
        if (string.IsNullOrWhiteSpace(user.MemberId)) return false;
        return await db.TeamMembers.AsNoTracking().AnyAsync(
            member => member.TeamId == teamId && member.MemberId == user.MemberId,
            cancellationToken);
    }

    /// <summary>チームの要員・所属を管理できるか判定します。</summary>
    public async Task<bool> CanManageTeamAsync(
        AuthUserDto user,
        string teamId,
        CancellationToken cancellationToken)
    {
        if (string.Equals(user.Role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase)) return true;
        if (string.IsNullOrWhiteSpace(user.MemberId)) return false;
        return await db.TeamMembers.AsNoTracking().AnyAsync(
            member => member.TeamId == teamId &&
                member.MemberId == user.MemberId &&
                member.TeamRole == TeamRoles.Manager,
            cancellationToken);
    }

    private static ProjectAccessDto FullAccess(string role)
    {
        return new ProjectAccessDto(role, true, true, true, true, true, true, true);
    }

    private static ProjectAccessDto ResolveAccess(string? projectRole, bool teamManager)
    {
        return projectRole switch
        {
            ProjectRoles.Owner => FullAccess(ProjectRoles.Owner),
            ProjectRoles.Planner => new ProjectAccessDto(
                ProjectRoles.Planner, true, true, false, teamManager, true, true, false),
            ProjectRoles.Member => new ProjectAccessDto(
                ProjectRoles.Member, true, false, false, teamManager, true, true, false),
            ProjectRoles.Viewer => new ProjectAccessDto(
                ProjectRoles.Viewer, true, false, false, teamManager, false, false, false),
            _ when teamManager => new ProjectAccessDto(
                TeamRoles.Manager, true, false, false, true, false, false, false),
            _ => NoAccess
        };
    }
}
