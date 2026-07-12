import type {
  Member,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
  WorkLogCategory,
} from "../../../types/schedule";

export const workLogCategoryLabels: Record<WorkLogCategory, string> = {
  improvement: "改善",
  incident: "障害",
  maintenance: "保守",
  meeting: "会議",
  other: "その他",
  support: "問い合わせ",
};
export const workLogCategoryOptions = Object.keys(workLogCategoryLabels) as WorkLogCategory[];

export type WorkLogEditorState = {
  mode: "create" | "edit";
  workLog: ProjectWorkLog;
};

export type WorkLogFilters = {
  category: WorkLogCategory | "all";
  memberId: string;
  month: string;
  query: string;
};

export function filterWorkLogs(
  workLogs: ProjectWorkLog[],
  filters: WorkLogFilters,
  memberById: Map<string, Member>,
  taskById: Map<string, ScheduleTask>,
  issueById: Map<string, ProjectIssue>,
) {
  const query = filters.query.trim().toLowerCase();
  return workLogs
    .filter((log) => {
      if (filters.memberId !== "all" && log.memberId !== filters.memberId) {
        return false;
      }
      if (filters.month !== "all" && !log.date.startsWith(filters.month)) {
        return false;
      }
      if (filters.category !== "all" && log.category !== filters.category) {
        return false;
      }
      if (!query) {
        return true;
      }
      const searchable = [
        log.summary,
        log.note ?? "",
        memberById.get(log.memberId)?.name ?? "",
        log.taskId ? (taskById.get(log.taskId)?.title ?? "") : "",
        log.issueId ? (issueById.get(log.issueId)?.title ?? "") : "",
      ].join(" ");
      return searchable.toLowerCase().includes(query);
    })
    .toSorted((left, right) =>
      `${right.date}${right.updatedAt}`.localeCompare(`${left.date}${left.updatedAt}`),
    );
}

export function getWorkLogSummary(workLogs: ProjectWorkLog[]) {
  return {
    activeMembers: new Set(workLogs.map((log) => log.memberId)).size,
    operationHours: sumWorkLogHours(
      workLogs.filter(
        (log) =>
          log.category === "maintenance" ||
          log.category === "support" ||
          log.category === "incident",
      ),
    ),
    totalHours: sumWorkLogHours(workLogs),
  };
}

export function createBlankWorkLogDraft(
  members: Member[],
  currentUser: { name: string },
  now = new Date().toISOString(),
): ProjectWorkLog {
  return {
    billable: true,
    category: "maintenance",
    createdAt: now,
    createdBy: currentUser.name,
    date: now.slice(0, 10),
    hours: 1,
    id: "worklog-draft",
    memberId: members[0]?.id ?? "",
    summary: "",
    updatedAt: now,
  };
}

export function normalizeWorkLogDraft(workLog: ProjectWorkLog): ProjectWorkLog {
  return {
    ...workLog,
    hours: Number.isFinite(workLog.hours) ? Math.max(workLog.hours, 0) : 0,
    issueId: workLog.issueId || undefined,
    note: workLog.note?.trim() || undefined,
    summary: workLog.summary.trim() || "運用保守対応",
    taskId: workLog.taskId || undefined,
  };
}

export function buildWorkLogMonthOptions(workLogs: ProjectWorkLog[]) {
  return [...new Set(workLogs.map((log) => log.date.slice(0, 7)))].toSorted().toReversed();
}

export function sumWorkLogHours(workLogs: ProjectWorkLog[]) {
  return workLogs.reduce((total, log) => total + log.hours, 0);
}

export function formatWorkLogHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function formatWorkLogDate(date: string) {
  const [, year, month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
  return year && month && day ? `${year}/${Number(month)}/${Number(day)}` : date;
}

export function formatWorkLogMonth(month: string) {
  const [, year, monthValue] = month.match(/^(\d{4})-(\d{2})$/) ?? [];
  return year && monthValue ? `${year}年${Number(monthValue)}月` : month;
}

export function formatWorkLogDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
