import type { ViewMode } from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function WorkloadSummary({
  availableCount,
  memberCount,
  mode,
  openDemandCount,
  overloadedCount,
  peakLoad,
  teamCount,
  unassignedCount,
}: {
  availableCount: number;
  memberCount: number;
  mode: ViewMode;
  openDemandCount: number;
  overloadedCount: number;
  peakLoad: number;
  teamCount: number;
  unassignedCount: number;
}) {
  const unit = mode === "team" ? "チーム" : "名";
  return (
    <div className={styles.summary}>
      <Summary
        label={mode === "team" ? "表示チーム" : "表示メンバー"}
        value={`${mode === "team" ? teamCount : memberCount}${unit}`}
      />
      <Summary label="稼働超過" value={`${overloadedCount}${unit}`} detail={`最大 ${peakLoad}%`} />
      <Summary label="余力あり" value={`${availableCount}${unit}`} />
      <Summary
        label={mode === "plan" ? "未充足要員" : "未アサインタスク"}
        value={`${mode === "plan" ? openDemandCount : unassignedCount}件`}
      />
    </div>
  );
}

function Summary({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <article className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong className={styles.summaryValue}>{value}</strong>
      {detail ? <small className={styles.summaryDetail}>{detail}</small> : null}
    </article>
  );
}
