import { MarkdownPreview } from "../../../components/common/MarkdownPreview";
import type { AuthUser } from "../../../data/authRepository";
import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import type { DailyReport } from "../../../types/schedule";
import { getDailyReportProjectActuals, getDailyReportTask } from "../model/dailyReports";

import * as styles from "./DailyReportPage.css";

type DailyReportSidebarProps = {
  comment: string;
  currentUser: AuthUser;
  onAddComment: () => void;
  onCommentChange: (value: string) => void;
  report: DailyReport;
  schedules: ScheduleSnapshot[];
};

/** タスク実績への反映見込みと、提出済み日報へのコメントを表示します。 */
export function DailyReportSidebar({
  comment,
  currentUser,
  onAddComment,
  onCommentChange,
  report,
  schedules,
}: DailyReportSidebarProps) {
  const actuals = getDailyReportProjectActuals(report.entries, schedules);
  return (
    <aside className={styles.editorSide}>
      <section className={styles.actualSummary}>
        <strong>タスクへの反映</strong>
        {report.entries.map((entry) => {
          const task = getDailyReportTask(entry, schedules);
          return (
            <div key={entry.id}>
              <span>{task?.title ?? "タスク未選択"}</span>
              <b>
                {entry.progress ?? task?.progress ?? 0}% / {entry.hours}h
              </b>
            </div>
          );
        })}
        {report.entries.length === 0 ? (
          <span className={styles.empty}>反映するタスクはありません。</span>
        ) : null}
        <div>
          <span>案件別合計</span>
          <b>{[...actuals.totals.values()].reduce((sum, hours) => sum + hours, 0)}h</b>
        </div>
        <span className={styles.actualHint}>提出すると進捗と作業内容がタスクへ記録されます。</span>
        {actuals.exceeded ? (
          <span className={styles.actualWarning}>予定工数を超過しているタスクがあります。</span>
        ) : null}
      </section>
      <section className={styles.comments}>
        <h3>コメント</h3>
        {report.comments.map((item) => (
          <article className={styles.comment} key={item.id}>
            <header>
              <strong>{item.authorName}</strong>
              <time>{new Date(item.createdAt).toLocaleString("ja-JP")}</time>
            </header>
            <MarkdownPreview content={item.body} />
          </article>
        ))}
        {report.comments.length === 0 ? (
          <span className={styles.empty}>コメントはありません。</span>
        ) : null}
        <textarea
          aria-label="日報コメント"
          className={styles.commentInput}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder={`${currentUser.name}としてコメント`}
          value={comment}
        />
        <button
          className={styles.secondaryButton}
          disabled={!comment.trim() || report.version === 0}
          onClick={onAddComment}
          type="button"
        >
          コメントを追加
        </button>
      </section>
    </aside>
  );
}
