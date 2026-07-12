import type { ReactNode } from "react";

import type { buildWeekColumns } from "../../../lib/schedule";
import type { Member } from "../../../types/schedule";
import {
  addDateDays,
  buildMonthGroups,
  getMonthlyAllocation,
  type AssignmentWithProject,
  type OpenDemandWithProject,
} from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function StaffingDecisionPanel({
  assignments,
  demands,
  members,
  onAssignDemand,
  onAssignMember,
  weeks,
}: {
  assignments: AssignmentWithProject[];
  demands: OpenDemandWithProject[];
  members: Member[];
  onAssignDemand: (item: OpenDemandWithProject) => void;
  onAssignMember: (memberId: string) => void;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  const monthGroups = buildMonthGroups(weeks);
  const overloaded = members
    .flatMap((member) => {
      const memberAssignments = assignments.filter((item) => item.memberId === member.id);
      return monthGroups.map((month) => ({
        allocation: getMonthlyAllocation(
          memberAssignments,
          weeks.slice(month.startIndex, month.startIndex + month.span),
        ),
        member,
        month: month.label,
      }));
    })
    .filter((item) => item.allocation > 100)
    .toSorted((left, right) => right.allocation - left.allocation)
    .slice(0, 5);
  const available = members
    .flatMap((member) => {
      const memberAssignments = assignments.filter((item) => item.memberId === member.id);
      const candidate = monthGroups
        .map((month) => ({
          allocation: getMonthlyAllocation(
            memberAssignments,
            weeks.slice(month.startIndex, month.startIndex + month.span),
          ),
          member,
          month: month.label,
        }))
        .find((item) => item.allocation <= 50);
      return candidate ? [candidate] : [];
    })
    .toSorted((left, right) => left.allocation - right.allocation)
    .slice(0, 5);
  const shortages = demands
    .flatMap((item) =>
      monthGroups
        .filter((month) => {
          const monthWeeks = weeks.slice(month.startIndex, month.startIndex + month.span);
          const start = monthWeeks[0]?.start;
          const end = addDateDays(monthWeeks.at(-1)?.start, 6);
          return start && end && item.demand.startDate <= end && item.demand.endDate >= start;
        })
        .map((month) => ({ ...item, month: month.label })),
    )
    .slice(0, 5);

  return (
    <section className={styles.decisionPanel} aria-label="要員判断">
      <DecisionColumn count={shortages.length} title="要員不足">
        {shortages.map((item) => (
          <button
            className={styles.decisionAction}
            key={`${item.demand.id}-${item.month}`}
            onClick={() => onAssignDemand(item)}
            type="button"
          >
            <strong className={styles.decisionTitle}>
              {item.month} / {item.demand.role} {item.demand.requiredCount}名
            </strong>
            <span className={styles.decisionDetail}>{item.projectName}</span>
          </button>
        ))}
        {shortages.length === 0 ? <span className={styles.decisionEmpty}>不足なし</span> : null}
      </DecisionColumn>
      <DecisionColumn count={overloaded.length} title="過負荷">
        {overloaded.map((item) => (
          <div className={styles.decisionItem} key={`${item.member.id}-${item.month}`}>
            <strong className={styles.decisionTitle}>
              {item.month} / {item.member.name}
            </strong>
            <span className={styles.decisionValue}>{item.allocation}%</span>
          </div>
        ))}
        {overloaded.length === 0 ? <span className={styles.decisionEmpty}>過負荷なし</span> : null}
      </DecisionColumn>
      <DecisionColumn count={available.length} title="アサイン候補">
        {available.map((item) => (
          <button
            className={styles.decisionAction}
            key={`${item.member.id}-${item.month}`}
            onClick={() => onAssignMember(item.member.id)}
            type="button"
          >
            <strong className={styles.decisionTitle}>
              {item.month} / {item.member.name}
            </strong>
            <span className={styles.decisionDetail}>稼働 {item.allocation}%</span>
          </button>
        ))}
        {available.length === 0 ? <span className={styles.decisionEmpty}>候補なし</span> : null}
      </DecisionColumn>
    </section>
  );
}

function DecisionColumn({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <div className={styles.decisionColumn}>
      <header className={styles.decisionHeader}>
        <strong className={styles.decisionHeaderTitle}>{title}</strong>
        <span className={styles.decisionHeaderCount}>{count}件</span>
      </header>
      <div className={styles.decisionList}>{children}</div>
    </div>
  );
}
