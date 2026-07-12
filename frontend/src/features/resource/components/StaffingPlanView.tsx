import type { buildWeekColumns } from "../../../lib/schedule";
import type { Member, StaffingDemand } from "../../../types/schedule";
import type { AssignmentWithProject, OpenDemandWithProject } from "../model/workloadPlanning";
import { AssignmentPlanBoard } from "./AssignmentPlanBoard";
import { StaffingDecisionPanel } from "./StaffingDecisionPanel";
import { StaffingShortageTimeline } from "./StaffingShortageTimeline";

import * as styles from "./WorkloadOverviewPage.css";

type StaffingPlanViewProps = {
  assignments: AssignmentWithProject[];
  demands: OpenDemandWithProject[];
  members: Member[];
  onAddAssignment: () => void;
  onAddDemand: () => void;
  onAssignDemand: (projectId: string, demand: StaffingDemand) => void;
  onAssignMember: (memberId: string) => void;
  onEditAssignment: (assignment: AssignmentWithProject) => void;
  weeks: ReturnType<typeof buildWeekColumns>;
};

export function StaffingPlanView({
  assignments,
  demands,
  members,
  onAddAssignment,
  onAddDemand,
  onAssignDemand,
  onAssignMember,
  onEditAssignment,
  weeks,
}: StaffingPlanViewProps) {
  return (
    <>
      <div className={styles.planActions}>
        <button className={styles.primaryAction} onClick={onAddAssignment} type="button">
          アサイン追加
        </button>
        <button className={styles.secondaryAction} onClick={onAddDemand} type="button">
          要員要求追加
        </button>
      </div>
      <StaffingDecisionPanel
        assignments={assignments}
        demands={demands}
        members={members}
        onAssignDemand={(item) => onAssignDemand(item.projectId, item.demand)}
        onAssignMember={onAssignMember}
        weeks={weeks}
      />
      <div className={styles.demandBand}>
        <span className={styles.demandHeading}>未充足の要員要求</span>
        <div className={styles.demands}>
          {demands.map(({ demand, projectId, projectName }) => (
            <button
              className={styles.demand}
              key={demand.id}
              onClick={() => onAssignDemand(projectId, demand)}
              type="button"
            >
              <strong className={styles.demandTitle}>
                {projectName} / {demand.role} {demand.requiredCount}名
              </strong>
              <span className={styles.demandMeta}>
                {demand.startDate} - {demand.endDate} / {demand.allocationPercent}%
              </span>
            </button>
          ))}
          {demands.length === 0 ? (
            <span className={styles.description}>未充足の要員要求はありません。</span>
          ) : null}
        </div>
      </div>
      <StaffingShortageTimeline demands={demands} weeks={weeks} />
      <AssignmentPlanBoard
        assignments={assignments}
        members={members}
        onEdit={onEditAssignment}
        weeks={weeks}
      />
    </>
  );
}
