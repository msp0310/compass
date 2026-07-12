import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import { isMemberActive } from "../../../lib/members";
import type { buildWeekColumns } from "../../../lib/schedule";
import type {
  Member,
  ProjectAssignment,
  ResourceRowModel,
  StaffingDemand,
  Team,
} from "../../../types/schedule";

export type ViewMode = "plan" | "member" | "team";
export type CapacityFilter = "all" | "overloaded" | "available";

export type AssignmentWithProject = ProjectAssignment & {
  projectId: string;
  projectName: string;
};

export type OpenDemandWithProject = {
  demand: StaffingDemand;
  projectId: string;
  projectName: string;
};

export type TeamCapacityRow = {
  projectCount: number;
  rows: ResourceRowModel[];
  team: Team;
};

export type MonthGroup = {
  key: string;
  label: string;
  span: number;
  startIndex: number;
};

export function matchesCapacityFilter(percentages: number[], filter: CapacityFilter) {
  if (filter === "overloaded") {
    return percentages.some((percent) => percent >= 100);
  }
  if (filter === "available") {
    return percentages.every((percent) => percent < 70);
  }
  return true;
}

export function aggregateTeamCapacityCell(
  rows: ResourceRowModel[],
  index: number,
  week: string,
): ResourceRowModel["cells"][number] {
  const cells = rows.map((row) => row.cells[index]).filter(Boolean);
  const hours = cells.reduce((sum, cell) => sum + cell.hours, 0);
  const capacityHours = cells.reduce((sum, cell) => sum + cell.capacityHours, 0);
  const percent = capacityHours > 0 ? Math.round((hours / capacityHours) * 100) : 0;
  return {
    week,
    hours,
    capacityHours,
    percent,
    tone: percent >= 100 ? "danger" : percent >= 82 ? "warning" : "good",
    unavailableDays: cells.reduce((sum, cell) => sum + cell.unavailableDays, 0),
    contributions: cells.flatMap((cell) => cell.contributions),
  };
}

export function collectActiveMembers(schedules: ScheduleSnapshot[]): Member[] {
  const members = new Map<string, Member>();
  schedules.forEach((snapshot) =>
    snapshot.members.forEach((member) => members.set(member.id, member)),
  );
  return [...members.values()].filter(isMemberActive);
}

export function getScopedMembers(
  members: Member[],
  schedules: ScheduleSnapshot[],
  team?: Team,
): Member[] {
  const assignedIds = new Set(
    schedules.flatMap((snapshot) => snapshot.tasks.flatMap((task) => task.assigneeIds)),
  );
  const teamIds = new Set(team?.memberIds);
  return members.filter((member) => !team || teamIds.has(member.id) || assignedIds.has(member.id));
}

export function formatYearPeriod(start: string, end: string) {
  return `${formatYearMonth(start)} - ${formatYearMonth(end)}`;
}

export function buildMonthGroups(weeks: ReturnType<typeof buildWeekColumns>): MonthGroup[] {
  const groups: MonthGroup[] = [];
  weeks.forEach((week, index) => {
    const key = week.start?.slice(0, 7) ?? "unknown";
    const current = groups.at(-1);
    if (current?.key === key) {
      current.span += 1;
      return;
    }
    const [year, month] = key.split("-");
    groups.push({
      key,
      label: key === "unknown" ? "期間未設定" : `${year}/${Number(month)}`,
      span: 1,
      startIndex: index,
    });
  });
  return groups;
}

export function buildMonthWeekLabels(weeks: ReturnType<typeof buildWeekColumns>) {
  let currentMonth = "";
  let weekOfMonth = 0;
  return weeks.map((week) => {
    const month = week.start?.slice(0, 7) ?? "unknown";
    if (month !== currentMonth) {
      currentMonth = month;
      weekOfMonth = 1;
    } else {
      weekOfMonth += 1;
    }
    return `W${weekOfMonth}`;
  });
}

export function getMonthlyAllocation(
  assignments: ProjectAssignment[],
  weeks: ReturnType<typeof buildWeekColumns>,
) {
  return weeks.reduce((peak, week) => {
    if (!week.start) {
      return peak;
    }
    const weekEnd = addDateDays(week.start, 6)!;
    const allocation = assignments
      .filter((assignment) => assignment.startDate <= weekEnd && assignment.endDate >= week.start!)
      .reduce((sum, assignment) => sum + assignment.allocationPercent, 0);
    return Math.max(peak, allocation);
  }, 0);
}

export function aggregateDemandRoles(
  demands: OpenDemandWithProject[],
  weeks: ReturnType<typeof buildWeekColumns>,
) {
  const start = weeks[0]?.start;
  const end = addDateDays(weeks.at(-1)?.start, 6);
  if (!start || !end) {
    return [];
  }
  const counts = new Map<string, number>();
  demands
    .filter(({ demand }) => demand.startDate <= end && demand.endDate >= start)
    .forEach(({ demand }) =>
      counts.set(demand.role, (counts.get(demand.role) ?? 0) + demand.requiredCount),
    );
  return [...counts.entries()].map(([role, count]) => `${role} ${count}名`);
}

export function getProjectAssignments(
  snapshot: ScheduleSnapshot,
  members: Member[],
): ProjectAssignment[] {
  if ((snapshot.project.assignments?.length ?? 0) > 0) {
    return snapshot.project.assignments ?? [];
  }
  const memberById = new Map(members.map((member) => [member.id, member]));
  return (snapshot.project.memberIds ?? []).map((memberId) => ({
    allocationPercent: 50,
    endDate: snapshot.project.rangeEnd,
    id: `derived-${snapshot.project.id}-${memberId}`,
    memberId,
    role: memberById.get(memberId)?.role ?? "SE",
    startDate: snapshot.project.rangeStart,
    status: "confirmed",
  }));
}

export function addDateDays(dateKey: string | undefined, days: number) {
  if (!dateKey) {
    return undefined;
  }
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addDateMonths(dateKey: string, months: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function getAssignmentPosition(
  assignment: ProjectAssignment,
  visibleStart: string,
  visibleEnd: string,
) {
  const totalDays = Math.max(diffDateDays(visibleStart, visibleEnd) + 1, 1);
  const start = assignment.startDate < visibleStart ? visibleStart : assignment.startDate;
  const end = assignment.endDate > visibleEnd ? visibleEnd : assignment.endDate;
  return {
    left: (Math.max(diffDateDays(visibleStart, start), 0) / totalDays) * 100,
    width: (Math.max(diffDateDays(start, end) + 1, 1) / totalDays) * 100,
  };
}

export function getProjectColor(projectId: string) {
  const colors = ["#5f85eb", "#45a882", "#8a70df", "#e29a42", "#4d9db5", "#d46f83"];
  const hash = [...projectId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function isCurrentWeek(weekStart: string | undefined, todayKey: string) {
  const weekEnd = addDateDays(weekStart, 6);
  return Boolean(weekStart && weekEnd && weekStart <= todayKey && todayKey <= weekEnd);
}

function formatYearMonth(dateKey: string) {
  const [year, month] = dateKey.split("-");
  return `${year}/${Number(month)}`;
}

function diffDateDays(start: string, end: string) {
  return Math.round(
    (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) /
      86_400_000,
  );
}
