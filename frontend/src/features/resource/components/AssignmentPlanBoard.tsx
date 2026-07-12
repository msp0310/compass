import type { CSSProperties } from "react";

import { Avatar } from "../../../components/ui/Avatar";
import type { buildWeekColumns } from "../../../lib/schedule";
import type { Member } from "../../../types/schedule";
import {
  addDateDays,
  buildMonthGroups,
  buildMonthWeekLabels,
  getAssignmentPosition,
  getMonthlyAllocation,
  getProjectColor,
  type AssignmentWithProject,
} from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function AssignmentPlanBoard({
  assignments,
  members,
  onEdit,
  weeks,
}: {
  assignments: AssignmentWithProject[];
  members: Member[];
  onEdit: (assignment: AssignmentWithProject) => void;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  const visibleStart = weeks[0]?.start;
  const visibleEnd = addDateDays(weeks.at(-1)?.start, 6);
  const monthGroups = buildMonthGroups(weeks);
  const weekLabels = buildMonthWeekLabels(weeks);
  const timelineMinWidth = Math.max(920, weeks.length * 40 + 220);
  return (
    <div className={styles.planBoard} aria-label="アサイン計画ボード">
      <div style={{ minWidth: timelineMinWidth }}>
        <div className={styles.planHeader}>
          <div className={styles.planMemberHead}>メンバー / 参画案件</div>
          <div className={styles.planWeeks} aria-label="月・週の時間軸">
            <div
              className={styles.planMonthRow}
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {monthGroups.map((month) => (
                <div
                  className={styles.planMonth}
                  key={month.key}
                  style={{ gridColumn: `span ${month.span}` }}
                >
                  {month.label}
                </div>
              ))}
            </div>
            <div
              className={styles.planWeekRow}
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {weeks.map((week, index) => (
                <div className={styles.planWeek} key={week.key}>
                  {weekLabels[index]}
                </div>
              ))}
            </div>
          </div>
        </div>
        {members.map((member) => {
          const memberAssignments = assignments.filter(
            (assignment) =>
              assignment.memberId === member.id &&
              visibleStart &&
              visibleEnd &&
              assignment.endDate >= visibleStart &&
              assignment.startDate <= visibleEnd,
          );
          return (
            <div
              className={styles.planRow}
              key={member.id}
              style={{ minHeight: Math.max(72, memberAssignments.length * 38 + 42) }}
            >
              <div className={styles.planMember}>
                <Avatar member={member} />
                <span className={styles.entityText}>
                  <strong className={styles.entityName}>{member.name}</strong>
                  <small className={styles.entityMeta}>{member.role}</small>
                </span>
              </div>
              <div
                className={styles.planTrack}
                style={{ backgroundSize: `${100 / Math.max(weeks.length, 1)}% 100%` }}
              >
                <div
                  className={styles.monthlyAllocationRow}
                  aria-label={`${member.name}の月別アサイン率`}
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                  {monthGroups.map((month) => {
                    const allocation = getMonthlyAllocation(
                      memberAssignments,
                      weeks.slice(month.startIndex, month.startIndex + month.span),
                    );
                    return (
                      <div
                        className={`${styles.monthlyAllocation} ${getAllocationTone(allocation)}`}
                        key={month.key}
                        style={{ gridColumn: `span ${month.span}` }}
                        title={`${month.label} ${allocation}%`}
                      >
                        {allocation}%
                      </div>
                    );
                  })}
                </div>
                {visibleStart && visibleEnd
                  ? memberAssignments.map((assignment, index) => {
                      const position = getAssignmentPosition(assignment, visibleStart, visibleEnd);
                      return (
                        <button
                          className={`${styles.assignmentBar} ${assignment.status === "draft" ? styles.assignmentDraft : ""}`}
                          key={assignment.id}
                          onClick={() => onEdit(assignment)}
                          style={
                            {
                              "--assignment-color": getProjectColor(assignment.projectId),
                              left: `${position.left}%`,
                              top: 36 + index * 38,
                              width: `${position.width}%`,
                            } as CSSProperties
                          }
                          title={`${assignment.projectName} / ${assignment.role} / ${assignment.allocationPercent}%`}
                          type="button"
                        >
                          <strong className={styles.assignmentName}>
                            {assignment.projectName}
                          </strong>
                          <span className={styles.assignmentMeta}>
                            {assignment.role} / {assignment.allocationPercent}%
                          </span>
                        </button>
                      );
                    })
                  : null}
              </div>
            </div>
          );
        })}
        {members.length === 0 ? (
          <div className={styles.empty}>表示対象のメンバーがいません。</div>
        ) : null}
      </div>
    </div>
  );
}

function getAllocationTone(allocation: number) {
  if (allocation > 100) {
    return styles.monthlyAllocationOver;
  }
  if (allocation >= 80) {
    return styles.monthlyAllocationFull;
  }
  if (allocation > 0) {
    return styles.monthlyAllocationAvailable;
  }
  return styles.monthlyAllocationEmpty;
}
