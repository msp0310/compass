import { daysInclusive, getWorkingDays } from "../../../lib/schedule";
import type { ScheduleHealthReport } from "../../../lib/scheduleHealth";
import type {
  CalendarDefinition,
  ProgressStats,
  Project,
  ResourceRowModel,
  ScheduleTask,
} from "../../../types/schedule";

export function buildProjectSummaryModel({
  calendar,
  calendarAware,
  healthReport,
  project,
  resourceRows,
  stats,
  tasks,
}: {
  calendar: CalendarDefinition;
  calendarAware: boolean;
  healthReport: ScheduleHealthReport;
  project: Project;
  resourceRows: ResourceRowModel[];
  stats: ProgressStats;
  tasks: ScheduleTask[];
}) {
  const actionableTasks = tasks.filter((task) => task.type === "task");
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const phases = tasks.filter((task) => task.type === "phase");
  const milestones = tasks
    .filter((task) => task.type === "milestone")
    .toSorted((left, right) => left.start.localeCompare(right.start));
  const delayedTasks = actionableTasks
    .filter((task) => task.status === "delayed")
    .toSorted((left, right) => left.end.localeCompare(right.end));
  const blockedTasks = actionableTasks
    .filter((task) =>
      (task.dependencies ?? []).some((dependencyId) => {
        const dependency = taskById.get(dependencyId);
        return dependency != null && dependency.status !== "done";
      }),
    )
    .slice(0, 4);
  const highLoadRows = resourceRows
    .filter((row) => row.utilization >= 80)
    .toSorted((left, right) => right.utilization - left.utilization)
    .slice(0, 4);
  const totalEffort = actionableTasks.reduce(
    (sum, task) =>
      sum + (task.effortHours ?? getWorkingDays(task.start, task.end, calendar, calendarAware) * 8),
    0,
  );
  const completedEffort = actionableTasks.reduce((sum, task) => {
    const effort =
      task.effortHours ?? getWorkingDays(task.start, task.end, calendar, calendarAware) * 8;
    return sum + (effort * task.progress) / 100;
  }, 0);
  const forecastTone =
    healthReport.dangerCount > 0 ||
    stats.delayed > 0 ||
    blockedTasks.length > 0 ||
    highLoadRows.length > 0
      ? "attention"
      : stats.progress >= 70
        ? "good"
        : "neutral";

  return {
    baselineCapturedAt: tasks.find((task) => task.baselineCapturedAt)?.baselineCapturedAt,
    blockedTasks,
    completedEffort,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    delayedTasks,
    forecastTone,
    hasBaseline: tasks.some((task) => task.baselineStart && task.baselineEnd),
    highLoadRows,
    milestones,
    nextOpenMilestone: milestones.find((task) => task.status !== "done"),
    phases,
    projectDays: daysInclusive(project.rangeStart, project.rangeEnd),
    totalEffort,
    workingDays: getWorkingDays(project.rangeStart, project.rangeEnd, calendar, calendarAware),
  } as const;
}

export function getLoadTone(value: number) {
  return value >= 90 ? "danger" : value >= 80 ? "warning" : "good";
}
