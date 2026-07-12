import { useState } from "react";

import type { ScheduleHealthIssue, ScheduleHealthReport } from "../../../../lib/scheduleHealth";
import { EmptyDashboardRow, PanelHeader } from "./TaskProgressPanels";

type HealthPanelProps = {
  healthReport: ScheduleHealthReport;
  onOpenHealthIssue: (issue: ScheduleHealthIssue) => void;
};

/** 健全性スコアと修正導線を、主要5件から段階表示します。 */
export function HealthPanel({ healthReport, onOpenHealthIssue }: HealthPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const hiddenCount = Math.max(healthReport.issues.length - 5, 0);
  return (
    <section className="dashboard-panel health-panel">
      <PanelHeader
        detail={`${healthReport.statusLabel} / ${healthReport.score}点`}
        title="健全性チェック"
      />
      <div className="health-score-row">
        <div
          className={`health-score-ring ${getHealthTone(healthReport)}`}
          aria-label={`健全性スコア ${healthReport.score}`}
        >
          {healthReport.score}
        </div>
        <div>
          <strong>{healthReport.statusLabel}</strong>
          <small>
            エラー{healthReport.dangerCount} / 警告{healthReport.warningCount}
          </small>
        </div>
      </div>
      <div className="health-list">
        {(showAll ? healthReport.issues : healthReport.issues.slice(0, 5)).map((issue) => (
          <HealthIssueRow issue={issue} key={issue.id} onOpenIssue={onOpenHealthIssue} />
        ))}
        {hiddenCount > 0 ? (
          <button
            className="health-list-more"
            onClick={() => setShowAll((current) => !current)}
            type="button"
          >
            {showAll ? "主要5件に戻す" : `残り${hiddenCount}件を表示`}
          </button>
        ) : null}
        {healthReport.issues.length === 0 ? (
          <EmptyDashboardRow label="データ整合性の問題はありません" />
        ) : null}
      </div>
    </section>
  );
}

function HealthIssueRow({
  issue,
  onOpenIssue,
}: {
  issue: ScheduleHealthIssue;
  onOpenIssue: (issue: ScheduleHealthIssue) => void;
}) {
  return (
    <button
      aria-label={`${issue.title}を${getHealthActionLabel(issue)}で確認`}
      className={`health-row ${issue.severity}`}
      onClick={() => onOpenIssue(issue)}
      type="button"
    >
      <span className="health-row-badge">
        {issue.severity === "danger" ? "修正" : issue.severity === "warning" ? "確認" : "情報"}
      </span>
      <div>
        <strong>{issue.title}</strong>
        <small>{issue.detail}</small>
      </div>
      <span className="health-row-action">{getHealthActionLabel(issue)}</span>
    </button>
  );
}

function getHealthActionLabel(issue: ScheduleHealthIssue) {
  if (issue.taskId) {
    return "ガント";
  }
  if (issue.category === "calendar") {
    return "カレンダー";
  }
  if (issue.category === "load") {
    return "リソース";
  }
  if (issue.category === "assign") {
    return "メンバー";
  }
  return "ガント";
}

function getHealthTone(report: ScheduleHealthReport) {
  return report.dangerCount > 0 ? "danger" : report.warningCount > 0 ? "warning" : "good";
}
