import { useMemo } from "react";

import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import { buildCrossProjectResourceRows } from "../../../lib/resourceCalculations";
import { buildTimeline, buildWeekColumns } from "../../../lib/schedule";
import type { CalendarDefinition, Team } from "../../../types/schedule";
import {
  addDateDays,
  addDateMonths,
  aggregateTeamCapacityCell,
  collectActiveMembers,
  getProjectAssignments,
  getScopedMembers,
  matchesCapacityFilter,
  type CapacityFilter,
  type ViewMode,
} from "../model/workloadPlanning";

type UseWorkloadOverviewModelOptions = {
  calendar: CalendarDefinition;
  calendarAware: boolean;
  capacityFilter: CapacityFilter;
  mode: ViewMode;
  periodOffset: number;
  schedules: ScheduleSnapshot[];
  teamId: string;
  teams: Team[];
  todayKey: string;
};

/** 画面表示に必要な横断集計を一か所に閉じ込め、ページを構成責務だけに保ちます。 */
export function useWorkloadOverviewModel({
  calendar,
  calendarAware,
  capacityFilter,
  mode,
  periodOffset,
  schedules,
  teamId,
  teams,
  todayKey,
}: UseWorkloadOverviewModelOptions) {
  const activeSchedules = useMemo(
    () => schedules.filter((snapshot) => snapshot.project.status !== "archived"),
    [schedules],
  );
  const members = useMemo(() => collectActiveMembers(activeSchedules), [activeSchedules]);
  const currentMonth = `${todayKey.slice(0, 7)}-01`;
  const periodStart = addDateMonths(currentMonth, periodOffset * 12);
  const periodEnd = addDateDays(addDateMonths(periodStart, 12), -1)!;
  const weeks = useMemo(
    () => buildWeekColumns(buildTimeline(periodStart, periodEnd, calendar, calendarAware, "day")),
    [calendar, calendarAware, periodEnd, periodStart],
  );
  const scopedSchedules = useMemo(
    () =>
      teamId === "all"
        ? activeSchedules
        : activeSchedules.filter((item) => item.project.teamId === teamId),
    [activeSchedules, teamId],
  );
  const scopedMembers = useMemo(
    () =>
      getScopedMembers(
        members,
        scopedSchedules,
        teams.find((team) => team.id === teamId),
      ),
    [members, scopedSchedules, teamId, teams],
  );
  const memberRows = useMemo(
    () =>
      buildCrossProjectResourceRows({
        baseCalendar: calendar,
        calendarAware,
        members: scopedMembers,
        schedules: scopedSchedules,
        weeks,
      }),
    [calendar, calendarAware, scopedMembers, scopedSchedules, weeks],
  );
  const projectAssignments = useMemo(
    () =>
      scopedSchedules.flatMap((snapshot) =>
        getProjectAssignments(snapshot, members).map((assignment) => ({
          ...assignment,
          projectId: snapshot.project.id,
          projectName: snapshot.project.workspace,
        })),
      ),
    [members, scopedSchedules],
  );
  const openDemands = useMemo(
    () =>
      scopedSchedules.flatMap((snapshot) =>
        (snapshot.project.staffingDemands ?? [])
          .filter((demand) => demand.status === "open")
          .map((demand) => ({
            demand,
            projectId: snapshot.project.id,
            projectName: snapshot.project.workspace,
          })),
      ),
    [scopedSchedules],
  );
  const teamRows = useMemo(
    () =>
      teams.map((team) => {
        const teamSchedules = activeSchedules.filter((item) => item.project.teamId === team.id);
        const teamMembers = getScopedMembers(members, teamSchedules, team);
        const rows = buildCrossProjectResourceRows({
          baseCalendar: calendar,
          calendarAware,
          members: teamMembers,
          schedules: teamSchedules,
          weeks,
        });
        return { rows, team, projectCount: teamSchedules.length };
      }),
    [activeSchedules, calendar, calendarAware, members, teams, weeks],
  );

  const summary = useMemo(() => {
    const percentages =
      mode === "team"
        ? teamRows.map((item) =>
            weeks.map(
              (week, index) => aggregateTeamCapacityCell(item.rows, index, week.key).percent,
            ),
          )
        : memberRows.map((row) => row.cells.map((cell) => cell.percent));
    return {
      availableCount: percentages.filter((values) => values.every((value) => value < 70)).length,
      overloadedCount: percentages.filter((values) => values.some((value) => value >= 100)).length,
      peakLoad: Math.max(0, ...percentages.flat()),
      unassignedCount: scopedSchedules.reduce(
        (count, snapshot) =>
          count +
          snapshot.tasks.filter((task) => task.type === "task" && task.assigneeIds.length === 0)
            .length,
        0,
      ),
    };
  }, [memberRows, mode, scopedSchedules, teamRows, weeks]);

  const filteredMemberRows = useMemo(
    () =>
      memberRows.filter((row) =>
        matchesCapacityFilter(
          row.cells.map((cell) => cell.percent),
          capacityFilter,
        ),
      ),
    [capacityFilter, memberRows],
  );
  const filteredTeamRows = useMemo(
    () =>
      teamRows.filter((item) =>
        matchesCapacityFilter(
          weeks.map((week, index) => aggregateTeamCapacityCell(item.rows, index, week.key).percent),
          capacityFilter,
        ),
      ),
    [capacityFilter, teamRows, weeks],
  );

  return {
    activeSchedules,
    filteredMemberRows,
    filteredTeamRows,
    memberRows,
    members,
    openDemands,
    periodEnd,
    periodStart,
    projectAssignments,
    scopedMembers,
    scopedSchedules,
    summary,
    teamRows,
    weeks,
  };
}
