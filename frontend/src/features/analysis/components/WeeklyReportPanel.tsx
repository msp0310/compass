import type {
  Member,
  Project,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
  TaskInspectorFocusTarget,
} from "../../../types/schedule";
import { WeeklyProgressSummary } from "./WeeklyProgressSummary";

type WeeklyReportPanelProps = {
  issues: ProjectIssue[];
  members: Member[];
  onOpenIssues: () => void;
  onSelectTask: (
    taskId: string,
    focusTarget?: TaskInspectorFocusTarget,
    projectId?: string,
  ) => void;
  project: Project;
  tasks: ScheduleTask[];
  todayKey: string;
  workLogs: ProjectWorkLog[];
};

/** 定例会で確認する週次の作業予定と、プロジェクト全体の到達状況を表示します。 */
export function WeeklyReportPanel({
  issues,
  members,
  onOpenIssues,
  onSelectTask,
  project,
  tasks,
  todayKey,
  workLogs,
}: WeeklyReportPanelProps) {
  const [weekStart, weekEnd] = weekRange(todayKey);
  const dailyReportLogs = workLogs.filter(
    (log) => log.dailyReportId && log.date >= weekStart && log.date <= weekEnd,
  );
  const memberRows = members
    .map((member) => ({
      hours: dailyReportLogs
        .filter((log) => log.memberId === member.id)
        .reduce((sum, log) => sum + log.hours, 0),
      member,
      summaries: [
        ...new Set(
          dailyReportLogs.filter((log) => log.memberId === member.id).map((log) => log.summary),
        ),
      ],
    }))
    .filter((row) => row.hours > 0);
  return (
    <section className="weekly-report-page" aria-label="週次報告">
      <header className="weekly-report-header">
        <div>
          <span>{project.workspace}</span>
          <h2>週次報告</h2>
          <p>その週に誰が何をするかと、計画に対するプロジェクト全体の到達状況を確認します。</p>
        </div>
        <div className="weekly-report-header-meta">
          <strong>
            {project.rangeStart} - {project.rangeEnd}
          </strong>
          <span>定例会向け</span>
        </div>
      </header>

      <section className="weekly-daily-report-summary" aria-label="日報からの週間実績">
        <header>
          <div>
            <h3>日報からの週間実績</h3>
            <span>
              {weekStart} - {weekEnd}
            </span>
          </div>
          <strong>{dailyReportLogs.reduce((sum, log) => sum + log.hours, 0)}h</strong>
        </header>
        {memberRows.length > 0 ? (
          <div className="weekly-daily-report-members">
            {memberRows.map((row) => (
              <article key={row.member.id}>
                <span>{row.member.initials}</span>
                <div>
                  <strong>{row.member.name}</strong>
                  <p>{row.summaries.join(" / ")}</p>
                </div>
                <b>{row.hours}h</b>
              </article>
            ))}
          </div>
        ) : (
          <p className="weekly-daily-report-empty">この週の日報実績はまだありません。</p>
        )}
      </section>

      <WeeklyProgressSummary
        issues={issues}
        members={members}
        onOpenIssues={onOpenIssues}
        onSelectTask={onSelectTask}
        projectEnd={project.rangeEnd}
        projectStart={project.rangeStart}
        tasks={tasks}
        todayKey={todayKey}
      />
    </section>
  );
}

function weekRange(dateKey: string): [string, string] {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}
