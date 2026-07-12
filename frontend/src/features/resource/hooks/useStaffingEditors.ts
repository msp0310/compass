import { useCallback, useState } from "react";

import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import type { Member, ProjectAssignment, StaffingDemand } from "../../../types/schedule";
import type { AssignmentEditorState, DemandEditorState } from "../components/StaffingEditors";
import { getProjectAssignments } from "../model/workloadPlanning";

type UseStaffingEditorsOptions = {
  activeSchedules: ScheduleSnapshot[];
  members: Member[];
  onUpdateProjectStaffing: (
    projectId: string,
    assignments: ProjectAssignment[],
    staffingDemands: StaffingDemand[],
  ) => void;
  scopedMembers: Member[];
  scopedSchedules: ScheduleSnapshot[];
};

/** アサイン・要員要求の編集ライフサイクルをページ本体から分離します。 */
export function useStaffingEditors({
  activeSchedules,
  members,
  onUpdateProjectStaffing,
  scopedMembers,
  scopedSchedules,
}: UseStaffingEditorsOptions) {
  const [assignmentEditor, setAssignmentEditor] = useState<AssignmentEditorState | null>(null);
  const [demandEditor, setDemandEditor] = useState<DemandEditorState | null>(null);

  const openAssignment = useCallback(
    (projectId = scopedSchedules[0]?.project.id, demand?: StaffingDemand, memberId?: string) => {
      const project = scopedSchedules.find((item) => item.project.id === projectId)?.project;
      const member = scopedMembers.find((item) => item.id === memberId) ?? scopedMembers[0];
      if (!project || !member) {
        return;
      }
      setAssignmentEditor({
        assignment: {
          allocationPercent: demand?.allocationPercent ?? 50,
          endDate: demand?.endDate ?? project.rangeEnd,
          id: `assignment-${project.id}-${Date.now()}`,
          memberId: member.id,
          role: demand?.role ?? member.role,
          startDate: demand?.startDate ?? project.rangeStart,
          status: "draft",
        },
        demandId: demand?.id,
        projectId: project.id,
      });
    },
    [scopedMembers, scopedSchedules],
  );

  const editAssignment = useCallback(
    (assignment: ProjectAssignment & { projectId: string }) =>
      setAssignmentEditor({ assignment, projectId: assignment.projectId }),
    [],
  );

  const saveAssignment = useCallback(
    (state: AssignmentEditorState) => {
      const snapshot = activeSchedules.find((item) => item.project.id === state.projectId);
      if (!snapshot) {
        return;
      }
      const assignments = getProjectAssignments(snapshot, members);
      const exists = assignments.some((item) => item.id === state.assignment.id);
      const nextAssignments = exists
        ? assignments.map((item) => (item.id === state.assignment.id ? state.assignment : item))
        : [...assignments, state.assignment];
      const nextDemands = (snapshot.project.staffingDemands ?? []).map((demand) =>
        demand.id === state.demandId ? { ...demand, status: "filled" as const } : demand,
      );
      onUpdateProjectStaffing(state.projectId, nextAssignments, nextDemands);
      setAssignmentEditor(null);
    },
    [activeSchedules, members, onUpdateProjectStaffing],
  );

  const deleteAssignment = useCallback(() => {
    if (!assignmentEditor) {
      return;
    }
    const snapshot = activeSchedules.find((item) => item.project.id === assignmentEditor.projectId);
    if (!snapshot) {
      return;
    }
    onUpdateProjectStaffing(
      assignmentEditor.projectId,
      getProjectAssignments(snapshot, members).filter(
        (item) => item.id !== assignmentEditor.assignment.id,
      ),
      snapshot.project.staffingDemands ?? [],
    );
    setAssignmentEditor(null);
  }, [activeSchedules, assignmentEditor, members, onUpdateProjectStaffing]);

  const openDemand = useCallback(() => {
    const project = scopedSchedules[0]?.project;
    if (!project) {
      return;
    }
    setDemandEditor({
      demand: {
        allocationPercent: 50,
        endDate: project.rangeEnd,
        id: `demand-${project.id}-${Date.now()}`,
        requiredCount: 1,
        role: "BE",
        startDate: project.rangeStart,
        status: "open",
      },
      projectId: project.id,
    });
  }, [scopedSchedules]);

  const saveDemand = useCallback(
    (state: DemandEditorState) => {
      const snapshot = activeSchedules.find((item) => item.project.id === state.projectId);
      if (!snapshot) {
        return;
      }
      const demands = snapshot.project.staffingDemands ?? [];
      const exists = demands.some((item) => item.id === state.demand.id);
      onUpdateProjectStaffing(
        state.projectId,
        getProjectAssignments(snapshot, members),
        exists
          ? demands.map((item) => (item.id === state.demand.id ? state.demand : item))
          : [...demands, state.demand],
      );
      setDemandEditor(null);
    },
    [activeSchedules, members, onUpdateProjectStaffing],
  );

  return {
    assignmentEditor,
    closeAssignmentEditor: () => setAssignmentEditor(null),
    closeDemandEditor: () => setDemandEditor(null),
    deleteAssignment,
    demandEditor,
    editAssignment,
    openAssignment,
    openDemand,
    saveAssignment,
    saveDemand,
  };
}
