import type {
  ProjectSummary,
  ScheduleSnapshot,
  ScheduleWorkspace,
  ScheduleWorkspaceSummary,
} from "../data/scheduleRepository";
import type { Project } from "../types/schedule";

/** 初期案件を決定するための候補情報です。 */
export type InitialProjectSelection = {
  draftProjectId?: string;
  hashProjectId?: string | null;
};

/** ハッシュ、保存済み表示状態、既定順の優先順位で初期案件を選びます。 */
export function selectInitialProject(
  summary: ScheduleWorkspaceSummary,
  selection: InitialProjectSelection,
): Project | undefined {
  const activeProjects = summary.projects
    .map((item) => item.project)
    .filter((project) => project.status !== "archived");
  return (
    activeProjects.find((project) => project.id === selection.hashProjectId) ??
    activeProjects.find((project) => project.id === selection.draftProjectId) ??
    activeProjects[0]
  );
}

/** 初期表示に必要なサマリーと選択案件の詳細を一つの状態へまとめます。 */
export function createInitialScheduleWorkspace(
  summary: ScheduleWorkspaceSummary,
  schedule: ScheduleSnapshot,
): ScheduleWorkspace {
  return {
    projectSummaries: summary.projects,
    schedules: [schedule],
    teams: summary.teams,
  };
}

/** 取得済み案件を重複なくワークスペースへ追加または置換します。 */
export function mergeScheduleIntoWorkspace(
  workspace: ScheduleWorkspace,
  schedule: ScheduleSnapshot,
): ScheduleWorkspace {
  const exists = workspace.schedules.some((item) => item.project.id === schedule.project.id);
  return {
    ...workspace,
    schedules: exists
      ? workspace.schedules.map((item) =>
          item.project.id === schedule.project.id ? schedule : item,
        )
      : [...workspace.schedules, schedule],
  };
}

/** 指定チームでまだ詳細を取得していない案件IDだけを返します。 */
export function findMissingProjectIds(
  summaries: ProjectSummary[],
  schedules: ScheduleSnapshot[],
  teamId: string,
): string[] {
  const loadedProjectIds = new Set(schedules.map((schedule) => schedule.project.id));
  return summaries
    .filter(
      (summary) =>
        summary.project.teamId === teamId &&
        summary.project.status !== "archived" &&
        !loadedProjectIds.has(summary.project.id),
    )
    .map((summary) => summary.project.id);
}
