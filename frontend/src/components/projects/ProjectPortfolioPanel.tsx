import {
  ArrowRightIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  StarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ProjectSummary, ScheduleSnapshot } from "../../data/scheduleRepository";
import {
  formatShortDate,
  getProgressStats,
  getTaskAssigneeAllocationPercent,
  getWorkingDays,
  statusLabels,
} from "../../lib/schedule";
import { isMemberActive } from "../../lib/members";
import {
  getProjectAssignedMembers,
  getProjectLifecycleStatus,
  projectLifecycleLabels,
  projectLifecycleOptions,
} from "../../lib/projects";
import type {
  Member,
  Project,
  ProjectLifecycleStatus,
  ScheduleTask,
  Team,
} from "../../types/schedule";

type ProjectPortfolioPanelProps = {
  activeProjectId: string;
  activeTeamId: string;
  calendarAware: boolean;
  favoriteProjectIds: Set<string>;
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  onTeamChange: (teamId: string) => void;
  onToggleFavoriteProject: (projectId: string) => void;
  onUpdateProjectLifecycleStatus: (projectId: string, status: ProjectLifecycleStatus) => void;
  projectSummaries: ProjectSummary[];
  schedules: ScheduleSnapshot[];
  teams: Team[];
};

type ProjectPortfolioItem = {
  assignedMembers: Member[];
  completedCount: number;
  delayedTasks: ScheduleTask[];
  favorite: boolean;
  lifecycleStatus: ProjectLifecycleStatus;
  memberCount: number;
  nextMilestone: Pick<ScheduleTask, "start" | "status" | "title">;
  progress: number;
  project: Project;
  taskCount: number;
  team: Team | undefined;
  workDays: number | null;
};

type TeamWorkloadItem = {
  delayedTaskCount: number;
  member: Member;
  openTaskCount: number;
  projectCount: number;
  remainingHours: number;
  topProject: Project | null;
};

type PortfolioFilter = "all" | "attention" | "favorites" | "lowProgress" | ProjectLifecycleStatus;
type PortfolioSort = "priority" | "milestone" | "name" | "progressAsc" | "progressDesc";

const portfolioFilterOptions: { label: string; value: PortfolioFilter }[] = [
  { label: "全件", value: "all" },
  { label: "計画", value: "planning" },
  { label: "進行中", value: "inProgress" },
  { label: "完了済み", value: "completed" },
  { label: "要対応", value: "attention" },
  { label: "お気に入り", value: "favorites" },
  { label: "低進捗", value: "lowProgress" },
];

const portfolioSortLabels: Record<PortfolioSort, string> = {
  milestone: "マイルストーンが近い順",
  name: "名称順",
  priority: "優先度順",
  progressAsc: "進捗が低い順",
  progressDesc: "進捗が高い順",
};

/** チーム配下のプロジェクトを一覧し、対象プロジェクトを選択します。 */
export function ProjectPortfolioPanel({
  activeProjectId,
  activeTeamId,
  calendarAware,
  favoriteProjectIds,
  onCreateProject,
  onSelectProject,
  onTeamChange,
  onToggleFavoriteProject,
  onUpdateProjectLifecycleStatus,
  projectSummaries,
  schedules,
  teams,
}: ProjectPortfolioPanelProps) {
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PortfolioSort>("priority");
  const team = teams.find((item) => item.id === activeTeamId);
  const teamSchedules = schedules.filter(
    (snapshot) =>
      snapshot.project.teamId === activeTeamId && snapshot.project.status !== "archived",
  );
  const teamProjectCount = projectSummaries.filter(
    (summary) =>
      summary.project.teamId === activeTeamId && summary.project.status !== "archived",
  ).length;
  const teamDetailsComplete = teamSchedules.length >= teamProjectCount;
  const allItems = useMemo(
    () =>
      projectSummaries
        .filter(
          (summary) =>
            summary.project.teamId === activeTeamId && summary.project.status !== "archived",
        )
        .map((summary) => {
          const snapshot = schedules.find((item) => item.project.id === summary.project.id);
          const projectTeam = teams.find((item) => item.id === summary.project.teamId);
          return snapshot
            ? buildPortfolioItem({
                calendarAware,
                favorite: favoriteProjectIds.has(summary.project.id),
                snapshot,
                team: projectTeam,
              })
            : buildPortfolioSummaryItem({
                favorite: favoriteProjectIds.has(summary.project.id),
                summary,
                team: projectTeam,
              });
        }),
    [activeTeamId, calendarAware, favoriteProjectIds, projectSummaries, schedules, teams],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      allItems
        .filter((item) => matchesPortfolioFilter(item, filter))
        .filter((item) => matchesPortfolioQuery(item, normalizedQuery))
        .sort((a, b) => comparePortfolioItems(a, b, sort)),
    [allItems, filter, normalizedQuery, sort],
  );
  const delayedProjectCount = filteredItems.filter(
    (item) => item.lifecycleStatus !== "completed" && item.delayedTasks.length > 0,
  ).length;
  const totalTasks = filteredItems.reduce((sum, item) => sum + item.taskCount, 0);
  const completedTasks = filteredItems.reduce((sum, item) => sum + item.completedCount, 0);
  const averageProgress =
    filteredItems.length > 0
      ? Math.round(
          filteredItems.reduce((sum, item) => sum + item.progress, 0) / filteredItems.length,
        )
      : 0;
  const lifecycleCounts = projectLifecycleOptions.reduce(
    (counts, option) => ({
      ...counts,
      [option.value]: allItems.filter((item) => item.lifecycleStatus === option.value).length,
    }),
    {} as Record<ProjectLifecycleStatus, number>,
  );
  const nextMilestones = filteredItems
    .filter((item) => item.lifecycleStatus !== "completed")
    .map((item) => ({
      milestone: item.nextMilestone,
      project: item.project,
    }))
    .sort((a, b) => a.milestone.start.localeCompare(b.milestone.start))
    .slice(0, 5);
  const attentionItems = allItems
    .filter(isAttentionProject)
    .sort((a, b) => comparePortfolioItems(a, b, "priority"))
    .slice(0, 5);
  const teamWorkloads = useMemo(
    () =>
      teamDetailsComplete
        ? buildTeamWorkloads({
            calendarAware,
            schedules: teamSchedules,
            team,
          })
        : [],
    [calendarAware, team, teamDetailsComplete, teamSchedules],
  );
  const maxWorkloadHours = Math.max(...teamWorkloads.map((item) => item.remainingHours), 1);
  const hasActiveFilter = filter !== "all" || normalizedQuery.length > 0;
  const teamCards = useMemo(
    () =>
      teams.map((item) => ({
        activeProjectCount: projectSummaries.filter(
          (summary) =>
            summary.project.teamId === item.id && summary.project.status !== "archived",
        ).length,
        memberCount: item.memberIds.length,
        team: item,
      })),
    [projectSummaries, teams],
  );

  return (
    <section className="portfolio-page" aria-label="プロジェクト一覧">
      <div className="portfolio-header">
        <div className="portfolio-heading">
          <span>選択中のチーム</span>
          <h2>{team?.name ?? "チーム未設定"}</h2>
        </div>
        <div className="portfolio-header-actions">
          <button className="primary-button" onClick={onCreateProject} type="button">
            <PlusIcon />
            プロジェクト追加
          </button>
        </div>
      </div>

      <div className="portfolio-team-strip" aria-label="チーム選択">
        {teamCards.map((item) => (
          <button
            aria-current={item.team.id === activeTeamId ? "true" : undefined}
            className={
              item.team.id === activeTeamId ? "portfolio-team-card active" : "portfolio-team-card"
            }
            key={item.team.id}
            onClick={() => onTeamChange(item.team.id)}
            type="button"
          >
            <span>{item.team.code}</span>
            <div>
              <strong>{item.team.name}</strong>
              <small>
                {item.activeProjectCount}案件 / {item.memberCount}名
              </small>
            </div>
          </button>
        ))}
      </div>

      <div className="portfolio-summary">
        <PortfolioSummaryCard
          detail={`計画${lifecycleCounts.planning} / 進行${lifecycleCounts.inProgress} / 完了${lifecycleCounts.completed}`}
          label="管理中プロジェクト"
          value={
            hasActiveFilter
              ? `${filteredItems.length}/${allItems.length}件`
              : `${allItems.length}件`
          }
        />
        <PortfolioSummaryCard
          detail={`${completedTasks} / ${totalTasks} タスク完了`}
          label="平均進捗"
          tone={averageProgress >= 70 ? "good" : "blue"}
          value={`${averageProgress}%`}
        />
        <PortfolioSummaryCard
          detail={
            delayedProjectCount > 0 ? "遅延タスクを含む案件があります" : "遅延タスクを含む案件なし"
          }
          label="要対応案件"
          tone={delayedProjectCount > 0 ? "hot" : "good"}
          value={`${delayedProjectCount}件`}
        />
        <PortfolioSummaryCard
          detail={
            nextMilestones[0]
              ? `${nextMilestones[0].project.workspace}`
              : "予定中のマイルストーンなし"
          }
          label="次の節目"
          value={nextMilestones[0] ? formatShortDate(nextMilestones[0].milestone.start) : "-"}
        />
      </div>

      <div className="portfolio-controls" aria-label="プロジェクト絞り込み">
        <label className="portfolio-search">
          <MagnifyingGlassIcon />
          <input
            aria-label="プロジェクト検索"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="案件名・マイルストーン・遅延タスクで検索"
            value={query}
          />
        </label>
        <div className="portfolio-filter-tabs" aria-label="状態フィルタ">
          {portfolioFilterOptions.map((option) => (
            <button
              className={filter === option.value ? "active" : ""}
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="portfolio-sort">
          <ArrowsUpDownIcon />
          <select
            aria-label="プロジェクト並び替え"
            onChange={(event) => setSort(event.target.value as PortfolioSort)}
            value={sort}
          >
            {Object.entries(portfolioSortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="portfolio-layout">
        <div className="portfolio-project-list">
          {filteredItems.map((item) => (
            <ProjectPortfolioCard
              active={item.project.id === activeProjectId}
              item={item}
              key={item.project.id}
              onSelectProject={onSelectProject}
              onToggleFavoriteProject={onToggleFavoriteProject}
              onUpdateProjectLifecycleStatus={onUpdateProjectLifecycleStatus}
            />
          ))}
          {allItems.length === 0 ? (
            <div className="portfolio-empty">
              <strong>このチームには有効なプロジェクトがありません</strong>
              <button className="primary-button" onClick={onCreateProject} type="button">
                <PlusIcon />
                プロジェクト追加
              </button>
            </div>
          ) : null}
          {allItems.length > 0 && filteredItems.length === 0 ? (
            <div className="portfolio-empty">
              <strong>条件に一致するプロジェクトはありません</strong>
              <button
                className="subtle-action"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
                type="button"
              >
                条件をクリア
              </button>
            </div>
          ) : null}
        </div>

        <aside className="portfolio-side" aria-label="プロジェクト横断状況">
          <section className="portfolio-side-panel">
            <PanelTitle
              detail={`${attentionItems.length}件`}
              icon={<ExclamationTriangleIcon />}
              title="要対応"
            />
            <div className="portfolio-attention-list">
              {attentionItems.map((item) => (
                <button
                  className="portfolio-attention-row"
                  key={item.project.id}
                  onClick={() => onSelectProject(item.project.id)}
                  type="button"
                >
                  <span>{item.delayedTasks.length > 0 ? "遅延" : "低進捗"}</span>
                  <div>
                    <strong>{item.project.workspace}</strong>
                    <small>{item.delayedTasks[0]?.title ?? `進捗 ${item.progress}%`}</small>
                  </div>
                </button>
              ))}
              {attentionItems.length === 0 ? (
                <p className="portfolio-side-empty">要対応案件はありません。</p>
              ) : null}
            </div>
          </section>

          <section className="portfolio-side-panel">
            <PanelTitle
              detail={`${nextMilestones.length}件`}
              icon={<FlagIcon />}
              title="近いマイルストーン"
            />
            <div className="portfolio-milestone-list">
              {nextMilestones.map(({ milestone, project }) => (
                <button
                  className="portfolio-milestone-row"
                  key={`${project.id}-${milestone.title}-${milestone.start}`}
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <span>{formatShortDate(milestone.start)}</span>
                  <div>
                    <strong>{milestone.title}</strong>
                    <small>{project.workspace}</small>
                  </div>
                </button>
              ))}
              {nextMilestones.length === 0 ? (
                <p className="portfolio-side-empty">予定中のマイルストーンはありません。</p>
              ) : null}
            </div>
          </section>

          <section className="portfolio-side-panel">
            <PanelTitle
              detail={teamDetailsComplete ? `${teamWorkloads.length}名` : "未集計"}
              icon={<UserGroupIcon />}
              title="チーム残作業"
            />
            <div className="portfolio-workload-list">
              {teamWorkloads.slice(0, 6).map((item) => (
                <button
                  className="portfolio-workload-row"
                  key={item.member.id}
                  onClick={() =>
                    item.topProject ? onSelectProject(item.topProject.id) : undefined
                  }
                  type="button"
                >
                  <span
                    className="portfolio-member-dot"
                    style={{ background: item.member.color }}
                  />
                  <div>
                    <strong>{item.member.name}</strong>
                    <small>
                      {Math.round(item.remainingHours)}h / {item.projectCount}案件
                      {item.delayedTaskCount > 0 ? ` / 遅延${item.delayedTaskCount}件` : ""}
                    </small>
                    <em>{item.topProject?.workspace ?? item.member.role}</em>
                    <div className="portfolio-workload-meter">
                      <span
                        style={{
                          width: `${Math.min(
                            (item.remainingHours / maxWorkloadHours) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
              {teamWorkloads.length === 0 ? (
                <p className="portfolio-side-empty">
                  {teamDetailsComplete
                    ? "表示できる残作業はありません。"
                    : "チーム横断Resourceを開くと集計します。"}
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function isAttentionProject(item: ProjectPortfolioItem) {
  return (
    item.lifecycleStatus !== "completed" && (item.delayedTasks.length > 0 || item.progress < 35)
  );
}

function matchesPortfolioFilter(item: ProjectPortfolioItem, filter: PortfolioFilter) {
  if (filter === "attention") return isAttentionProject(item);
  if (filter === "favorites") return item.favorite;
  if (filter === "lowProgress") return item.progress < 50;
  if (filter === "planning" || filter === "inProgress" || filter === "completed") {
    return item.lifecycleStatus === filter;
  }
  return true;
}

function matchesPortfolioQuery(item: ProjectPortfolioItem, query: string) {
  if (!query) return true;
  return [
    item.project.workspace,
    item.project.name,
    item.team?.name ?? "",
    projectLifecycleLabels[item.lifecycleStatus],
    item.nextMilestone.title,
    ...item.assignedMembers.map((member) => member.name),
    ...item.delayedTasks.map((task) => task.title),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function comparePortfolioItems(
  a: ProjectPortfolioItem,
  b: ProjectPortfolioItem,
  sort: PortfolioSort,
) {
  if (sort === "milestone") {
    return (
      a.nextMilestone.start.localeCompare(b.nextMilestone.start) ||
      a.project.rangeEnd.localeCompare(b.project.rangeEnd)
    );
  }
  if (sort === "name") {
    return a.project.workspace.localeCompare(b.project.workspace, "ja");
  }
  if (sort === "progressAsc") {
    return a.progress - b.progress || a.nextMilestone.start.localeCompare(b.nextMilestone.start);
  }
  if (sort === "progressDesc") {
    return b.progress - a.progress || a.nextMilestone.start.localeCompare(b.nextMilestone.start);
  }
  return (
    getPortfolioPriority(b) - getPortfolioPriority(a) ||
    a.nextMilestone.start.localeCompare(b.nextMilestone.start) ||
    a.project.rangeEnd.localeCompare(b.project.rangeEnd)
  );
}

function getPortfolioPriority(item: ProjectPortfolioItem) {
  return (
    Number(item.favorite) * 1000 +
    Math.min(item.delayedTasks.length, 8) * 100 +
    (item.progress < 35 ? 60 : 0) +
    Math.max(60 - item.progress, 0)
  );
}

function buildPortfolioItem({
  favorite,
  calendarAware,
  snapshot,
  team,
}: {
  calendarAware: boolean;
  favorite: boolean;
  snapshot: ScheduleSnapshot;
  team: Team | undefined;
}): ProjectPortfolioItem {
  const stats = getProgressStats(snapshot.tasks);
  const delayedTasks = snapshot.tasks
    .filter((task) => task.type === "task" && task.status === "delayed")
    .sort((a, b) => a.end.localeCompare(b.end));
  const nextMilestone =
    snapshot.tasks
      .filter((task) => task.type === "milestone" && task.status !== "done")
      .sort((a, b) => a.start.localeCompare(b.start))[0] ??
    ({
      start: snapshot.project.nextMilestone.date,
      status: "notStarted",
      title: snapshot.project.nextMilestone.title,
    } satisfies Pick<ScheduleTask, "start" | "status" | "title">);
  const activeTeamMemberIds = new Set(team?.memberIds ?? []);
  const assignedMembers = getProjectAssignedMembers({
    members: snapshot.members,
    project: snapshot.project,
    team,
  }).filter((member) => activeTeamMemberIds.has(member.id));
  const memberCount = assignedMembers.length;

  return {
    assignedMembers,
    completedCount: stats.completed,
    delayedTasks,
    favorite,
    lifecycleStatus: getProjectLifecycleStatus(snapshot.project),
    memberCount,
    nextMilestone,
    progress: stats.progress,
    project: snapshot.project,
    taskCount: stats.total,
    team,
    workDays: getWorkingDays(
      snapshot.project.rangeStart,
      snapshot.project.rangeEnd,
      snapshot.calendar,
      calendarAware,
    ),
  };
}

/** 詳細タスクをまだ取得していない案件を、集計値だけでカード表示します。 */
function buildPortfolioSummaryItem({
  favorite,
  summary,
  team,
}: {
  favorite: boolean;
  summary: ProjectSummary;
  team: Team | undefined;
}): ProjectPortfolioItem {
  return {
    assignedMembers: [],
    completedCount: summary.completedTaskCount,
    delayedTasks: Array.from({ length: summary.delayedTaskCount }, (_, index) => ({
      assigneeIds: [],
      color: "#f59e0b",
      end: summary.project.rangeEnd,
      id: `${summary.project.id}-delayed-${index}`,
      parentId: null,
      progress: summary.progress,
      start: summary.project.rangeEnd,
      status: "delayed",
      title: "遅延タスク",
      type: "task",
    } satisfies ScheduleTask)),
    favorite,
    lifecycleStatus: getProjectLifecycleStatus(summary.project),
    memberCount: summary.memberCount,
    nextMilestone: {
      start: summary.project.nextMilestone.date,
      status: "notStarted",
      title: summary.project.nextMilestone.title,
    },
    progress: summary.progress,
    project: summary.project,
    taskCount: summary.taskCount,
    team,
    workDays: null,
  };
}

function buildTeamWorkloads({
  calendarAware,
  schedules,
  team,
}: {
  calendarAware: boolean;
  schedules: ScheduleSnapshot[];
  team: Team | undefined;
}): TeamWorkloadItem[] {
  const teamMemberIds = new Set(team?.memberIds ?? []);
  const workloads = new Map<
    string,
    TeamWorkloadItem & {
      projectHours: Map<string, number>;
      projectRefs: Map<string, Project>;
    }
  >();

  schedules.forEach((snapshot) => {
    snapshot.members
      .filter((member) => isMemberActive(member) && teamMemberIds.has(member.id))
      .forEach((member) => {
        if (!workloads.has(member.id)) {
          workloads.set(member.id, {
            delayedTaskCount: 0,
            member,
            openTaskCount: 0,
            projectCount: 0,
            projectHours: new Map(),
            projectRefs: new Map(),
            remainingHours: 0,
            topProject: null,
          });
        }
      });

    snapshot.tasks
      .filter((task) => task.type === "task" && task.status !== "done")
      .forEach((task) => {
        const workingHours =
          task.effortHours ??
          getWorkingDays(task.start, task.end, snapshot.calendar, calendarAware) * 8;
        task.assigneeIds.forEach((memberId) => {
          if (!teamMemberIds.has(memberId)) return;
          const workload = workloads.get(memberId);
          if (!workload) return;
          const allocation = getTaskAssigneeAllocationPercent(task, memberId) / 100;
          const memberHours = workingHours * allocation * (1 - task.progress / 100);
          if (memberHours <= 0) return;
          workload.remainingHours += memberHours;
          workload.openTaskCount += 1;
          if (task.status === "delayed") workload.delayedTaskCount += 1;
          workload.projectRefs.set(snapshot.project.id, snapshot.project);
          workload.projectHours.set(
            snapshot.project.id,
            (workload.projectHours.get(snapshot.project.id) ?? 0) + memberHours,
          );
        });
      });
  });

  return [...workloads.values()]
    .map((item) => {
      const topProjectId = [...item.projectHours.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const { projectRefs, ...workload } = item;
      return {
        ...workload,
        projectCount: projectRefs.size,
        remainingHours: Math.round(item.remainingHours),
        topProject: topProjectId ? (projectRefs.get(topProjectId) ?? null) : null,
      };
    })
    .filter((item) => item.remainingHours > 0)
    .sort(
      (a, b) =>
        b.delayedTaskCount - a.delayedTaskCount ||
        b.remainingHours - a.remainingHours ||
        a.member.name.localeCompare(b.member.name, "ja"),
    );
}

function ProjectPortfolioCard({
  active,
  item,
  onSelectProject,
  onToggleFavoriteProject,
  onUpdateProjectLifecycleStatus,
}: {
  active: boolean;
  item: ProjectPortfolioItem;
  onSelectProject: (projectId: string) => void;
  onToggleFavoriteProject: (projectId: string) => void;
  onUpdateProjectLifecycleStatus: (projectId: string, status: ProjectLifecycleStatus) => void;
}) {
  const tone =
    item.delayedTasks.length > 0
      ? "hot"
      : item.progress >= 70
        ? "good"
        : item.progress === 0
          ? "neutral"
          : "blue";

  return (
    <article className={active ? "portfolio-card active" : "portfolio-card"}>
      <header className="portfolio-card-header">
        <div>
          <span>{item.team?.name ?? item.project.teamId}</span>
          <strong>{item.project.workspace}</strong>
        </div>
        <div className="portfolio-card-actions">
          <select
            aria-label={`${item.project.workspace} のステータス`}
            className={`portfolio-lifecycle-select ${item.lifecycleStatus}`}
            onChange={(event) =>
              onUpdateProjectLifecycleStatus(
                item.project.id,
                event.target.value as ProjectLifecycleStatus,
              )
            }
            value={item.lifecycleStatus}
          >
            {projectLifecycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            aria-label={item.favorite ? "お気に入りから外す" : "お気に入りに追加"}
            className={item.favorite ? "portfolio-favorite active" : "portfolio-favorite"}
            onClick={() => onToggleFavoriteProject(item.project.id)}
            title={item.favorite ? "お気に入りから外す" : "お気に入りに追加"}
            type="button"
          >
            <StarIcon />
          </button>
        </div>
      </header>

      <div className={`portfolio-lifecycle-banner ${item.lifecycleStatus}`}>
        <span>{projectLifecycleLabels[item.lifecycleStatus]}</span>
        <strong>{item.project.name}</strong>
      </div>

      <div className="portfolio-card-metrics">
        <div className={`portfolio-progress-ring ${tone}`}>{item.progress}%</div>
        <dl>
          <div>
            <dt>タスク</dt>
            <dd>
              {item.completedCount}/{item.taskCount}
            </dd>
          </div>
          <div>
            <dt>期間</dt>
            <dd>{item.workDays == null ? "詳細読込後" : `${item.workDays}稼働日`}</dd>
          </div>
          <div>
            <dt>体制</dt>
            <dd>{item.memberCount}名</dd>
          </div>
        </dl>
      </div>

      <div className="portfolio-card-progress">
        <span style={{ width: `${item.progress}%` }} />
      </div>

      <div className="portfolio-card-detail">
        <div>
          <FlagIcon />
          <span>
            {formatShortDate(item.nextMilestone.start)} {item.nextMilestone.title}
          </span>
        </div>
        <div>
          <UserGroupIcon />
          <span>
            {item.delayedTasks.length > 0
              ? `遅延 ${item.delayedTasks.length}件`
              : statusLabels[item.nextMilestone.status]}
          </span>
        </div>
      </div>

      <div className="portfolio-card-members">
        <UserGroupIcon />
        <div className="portfolio-member-stack" aria-hidden="true">
          {item.assignedMembers.slice(0, 4).map((member) => (
            <span key={member.id} style={{ "--avatar-color": member.color } as CSSProperties}>
              {member.initials}
            </span>
          ))}
        </div>
        <span>
          {item.assignedMembers.length > 0
            ? item.assignedMembers.map((member) => member.name).join(" / ")
            : "要員未アサイン"}
        </span>
      </div>

      <footer className="portfolio-card-footer">
        <span>
          {formatShortDate(item.project.rangeStart)} - {formatShortDate(item.project.rangeEnd)}
        </span>
        <button onClick={() => onSelectProject(item.project.id)} type="button">
          Ganttへ
          <ArrowRightIcon />
        </button>
      </footer>
    </article>
  );
}

function PortfolioSummaryCard({
  detail,
  label,
  tone = "blue",
  value,
}: {
  detail: string;
  label: string;
  tone?: "blue" | "good" | "hot";
  value: string;
}) {
  return (
    <article className={`portfolio-summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PanelTitle({ detail, icon, title }: { detail: string; icon: ReactNode; title: string }) {
  return (
    <div className="portfolio-panel-title">
      <div>
        {icon}
        <strong>{title}</strong>
      </div>
      <span>{detail}</span>
    </div>
  );
}
