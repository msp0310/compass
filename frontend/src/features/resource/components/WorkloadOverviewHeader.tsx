import type { ViewMode } from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function WorkloadOverviewHeader({
  mode,
  onModeChange,
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <header className={styles.header}>
      <div>
        <h2 className={styles.heading}>チーム分析・要員計画</h2>
        <span className={styles.description}>
          全案件の稼働を確認し、必要な要員とアサインを週単位で計画
        </span>
      </div>
      <div className={styles.segmented} aria-label="チーム分析・要員計画の表示軸">
        <ModeButton active={mode === "plan"} onClick={() => onModeChange("plan")}>
          アサイン計画
        </ModeButton>
        <ModeButton active={mode === "member"} onClick={() => onModeChange("member")}>
          人別
        </ModeButton>
        <ModeButton active={mode === "team"} onClick={() => onModeChange("team")}>
          チーム別
        </ModeButton>
      </div>
    </header>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`${styles.segment} ${active ? styles.segmentActive : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
