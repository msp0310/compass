import { useState } from "react";

import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import type {
  CalendarDefinition,
  ProjectAssignment,
  StaffingDemand,
  Team,
} from "../../../types/schedule";
import { useStaffingEditors } from "../hooks/useStaffingEditors";
import { useWorkloadOverviewModel } from "../hooks/useWorkloadOverviewModel";
import type { CapacityFilter, ViewMode } from "../model/workloadPlanning";
import { AssignmentEditor, DemandEditor } from "./StaffingEditors";
import { StaffingPlanView } from "./StaffingPlanView";
import { MemberCapacityGrid, TeamCapacityGrid } from "./WorkloadCapacityGrid";
import { WorkloadOverviewControls } from "./WorkloadOverviewControls";
import { WorkloadOverviewHeader } from "./WorkloadOverviewHeader";
import { WorkloadSummary } from "./WorkloadSummary";

import * as styles from "./WorkloadOverviewPage.css";

type WorkloadOverviewPageProps = {
  calendar: CalendarDefinition;
  calendarAware: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenTeam: (teamId: string) => void;
  onUpdateProjectStaffing: (
    projectId: string,
    assignments: ProjectAssignment[],
    staffingDemands: StaffingDemand[],
  ) => void;
  schedules: ScheduleSnapshot[];
  teams: Team[];
  todayKey: string;
};

/** 全案件を人・チーム・アサイン計画の三つの軸で比較するページです。 */
export function WorkloadOverviewPage({
  calendar,
  calendarAware,
  onOpenProject,
  onOpenTeam,
  onUpdateProjectStaffing,
  schedules,
  teams,
  todayKey,
}: WorkloadOverviewPageProps) {
  const [mode, setMode] = useState<ViewMode>("plan");
  const [teamId, setTeamId] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>("all");
  const [periodOffset, setPeriodOffset] = useState(0);
  const model = useWorkloadOverviewModel({
    calendar,
    calendarAware,
    capacityFilter,
    mode,
    periodOffset,
    schedules,
    teamId,
    teams,
    todayKey,
  });
  const editors = useStaffingEditors({
    activeSchedules: model.activeSchedules,
    members: model.members,
    onUpdateProjectStaffing,
    scopedMembers: model.scopedMembers,
    scopedSchedules: model.scopedSchedules,
  });

  return (
    <section className={styles.page} aria-label="チーム分析・要員計画">
      <WorkloadOverviewHeader mode={mode} onModeChange={setMode} />
      <WorkloadSummary
        availableCount={model.summary.availableCount}
        memberCount={model.memberRows.length}
        mode={mode}
        openDemandCount={model.openDemands.length}
        overloadedCount={model.summary.overloadedCount}
        peakLoad={model.summary.peakLoad}
        teamCount={model.teamRows.length}
        unassignedCount={model.summary.unassignedCount}
      />
      <WorkloadOverviewControls
        capacityFilter={capacityFilter}
        mode={mode}
        onCapacityFilterChange={setCapacityFilter}
        onNextPeriod={() => setPeriodOffset((current) => current + 1)}
        onPreviousPeriod={() => setPeriodOffset((current) => current - 1)}
        onTeamChange={setTeamId}
        periodEnd={model.periodEnd}
        periodStart={model.periodStart}
        teamId={teamId}
        teams={teams}
      />

      {mode === "plan" ? (
        <StaffingPlanView
          assignments={model.projectAssignments}
          demands={model.openDemands}
          members={model.scopedMembers}
          onAddAssignment={() => editors.openAssignment()}
          onAddDemand={editors.openDemand}
          onAssignDemand={(projectId, demand) => editors.openAssignment(projectId, demand)}
          onAssignMember={(memberId) => editors.openAssignment(undefined, undefined, memberId)}
          onEditAssignment={editors.editAssignment}
          weeks={model.weeks}
        />
      ) : mode === "member" ? (
        <MemberCapacityGrid
          onOpenProject={onOpenProject}
          rows={model.filteredMemberRows}
          todayKey={todayKey}
          weeks={model.weeks}
        />
      ) : (
        <TeamCapacityGrid
          onOpenProject={onOpenProject}
          onOpenTeam={onOpenTeam}
          rows={model.filteredTeamRows}
          todayKey={todayKey}
          weeks={model.weeks}
        />
      )}

      {editors.assignmentEditor ? (
        <AssignmentEditor
          members={model.members}
          onClose={editors.closeAssignmentEditor}
          onDelete={editors.deleteAssignment}
          onSave={editors.saveAssignment}
          projects={model.activeSchedules}
          state={editors.assignmentEditor}
        />
      ) : null}
      {editors.demandEditor ? (
        <DemandEditor
          onClose={editors.closeDemandEditor}
          onSave={editors.saveDemand}
          projects={model.activeSchedules}
          state={editors.demandEditor}
        />
      ) : null}
    </section>
  );
}
