import { formatDateWithWeekday } from "../../../../lib/schedule";
import type { ScheduleHealthReport } from "../../../../lib/scheduleHealth";
import type { ProgressStats, Project, ScheduleTask } from "../../../../types/schedule";

type StatusSummaryCardsProps = {
  blockedCount: number;
  completedEffort: number;
  completionRate: number;
  delayedTasks: ScheduleTask[];
  forecastTone: "attention" | "good" | "neutral";
  healthReport: ScheduleHealthReport;
  highLoadCount: number;
  nextOpenMilestone?: ScheduleTask;
  project: Project;
  projectDays: number;
  stats: ProgressStats;
  totalEffort: number;
  workingDays: number;
};

/** 概要上部の主要指標を、案件全体の判断順に表示します。 */
export function StatusSummaryCards(props: StatusSummaryCardsProps) {
  return (
    <div className="summary-strip">
      <SummaryCard
        detail={getProjectHealthDetail(props)}
        label="プロジェクト全体"
        tone={props.forecastTone}
        value={
          props.healthReport.dangerCount > 0
            ? "要修正"
            : props.forecastTone === "attention"
              ? "要注意"
              : "順調"
        }
      />
      <SummaryCard
        detail={
          props.delayedTasks[0] ? `${props.delayedTasks[0].title} を確認` : "期限超過タスクなし"
        }
        label="遅延タスク"
        tone={props.stats.delayed > 0 ? "hot" : "good"}
        value={`${props.stats.delayed} / ${props.stats.total}`}
      />
      <SummaryCard
        detail={`消化 ${Math.round(props.completedEffort)}h / 進捗 ${props.stats.progress}%`}
        label="総作業量"
        sparkline
        tone="neutral"
        value={`${Math.round(props.totalEffort)}h`}
      />
      <SummaryCard
        detail={formatDateWithWeekday(
          props.nextOpenMilestone?.start ?? props.project.nextMilestone.date,
        )}
        label="次のマイルストーン"
        tone="blue"
        value={props.nextOpenMilestone?.title ?? props.project.nextMilestone.title}
      />
      <SummaryCard
        detail={`${props.stats.completed}件が完了`}
        label="完了率"
        progressValue={props.completionRate}
        tone={props.completionRate >= 70 ? "good" : "blue"}
        value={`${props.completionRate}%`}
      />
    </div>
  );
}

function getProjectHealthDetail(props: StatusSummaryCardsProps) {
  if (props.healthReport.dangerCount > 0) {
    return `健全性エラー ${props.healthReport.dangerCount}件 / スコア ${props.healthReport.score}`;
  }
  if (props.stats.delayed > 0) {
    return `遅延 ${props.stats.delayed}件 / 高負荷 ${props.highLoadCount}名`;
  }
  if (props.blockedCount > 0) {
    return `前提未完了 ${props.blockedCount}件 / 高負荷 ${props.highLoadCount}名`;
  }
  return `稼働日 ${props.workingDays}日 / 全${props.projectDays}日`;
}

function SummaryCard({
  detail,
  label,
  progressValue,
  sparkline,
  tone,
  value,
}: {
  detail: string;
  label: string;
  progressValue?: number;
  sparkline?: boolean;
  tone: "attention" | "hot" | "good" | "neutral" | "blue";
  value: string;
}) {
  return (
    <article className={`summary-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sparkline ? (
        <svg className="sparkline" viewBox="0 0 120 28" aria-hidden="true">
          <path d="M4 21 L18 18 L31 19 L44 14 L58 16 L70 10 L82 14 L95 6 L108 13 L116 9" />
        </svg>
      ) : null}
      {progressValue != null ? (
        <div className="mini-progress">
          <span style={{ width: `${progressValue}%` }} />
        </div>
      ) : null}
      <small>{detail}</small>
    </article>
  );
}
