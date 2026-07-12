import type { buildWeekColumns } from "../../../lib/schedule";
import {
  aggregateDemandRoles,
  buildMonthGroups,
  type OpenDemandWithProject,
} from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function StaffingShortageTimeline({
  demands,
  weeks,
}: {
  demands: OpenDemandWithProject[];
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  const monthGroups = buildMonthGroups(weeks);
  const timelineMinWidth = Math.max(920, weeks.length * 40 + 220);
  return (
    <div className={styles.shortageScroll} aria-label="月別の要員不足">
      <div className={styles.shortageTimeline} style={{ minWidth: timelineMinWidth }}>
        <div className={styles.shortageLabel}>要員不足見通し</div>
        <div
          className={styles.shortageMonths}
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
        >
          {monthGroups.map((month) => {
            const roles = aggregateDemandRoles(
              demands,
              weeks.slice(month.startIndex, month.startIndex + month.span),
            );
            return (
              <div
                className={`${styles.shortageMonth} ${roles.length > 0 ? styles.shortageMonthActive : ""}`}
                key={month.key}
                style={{ gridColumn: `span ${month.span}` }}
              >
                <strong className={styles.shortageMonthTitle}>{month.label}</strong>
                <span className={styles.shortageMonthDetail}>
                  {roles.length > 0 ? roles.join(" / ") : "不足なし"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
