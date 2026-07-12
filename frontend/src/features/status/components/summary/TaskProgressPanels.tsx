import { formatShortDate, statusLabels } from "../../../../lib/schedule";
import type { ScheduleTask } from "../../../../types/schedule";

type TaskProgressPanelsProps = {
  blockedTasks: ScheduleTask[];
  delayedTasks: ScheduleTask[];
  onSelectTask: (taskId: string) => void;
  phases: ScheduleTask[];
};

export function TaskProgressPanels({
  blockedTasks,
  delayedTasks,
  onSelectTask,
  phases,
}: TaskProgressPanelsProps) {
  const riskTasks = [...delayedTasks, ...blockedTasks]
    .filter((task, index, rows) => rows.findIndex((item) => item.id === task.id) === index)
    .slice(0, 5);
  return (
    <>
      <section className="dashboard-panel phase-panel">
        <PanelHeader detail={`${phases.length}工程`} title="工程別進捗" />
        <div className="phase-list">
          {phases.map((phase) => (
            <button
              className="phase-row"
              key={phase.id}
              onClick={() => onSelectTask(phase.id)}
              type="button"
            >
              <div>
                <strong>{phase.title}</strong>
                <span className={`status-pill ${phase.status}`}>
                  <span />
                  {statusLabels[phase.status]}
                </span>
              </div>
              <div className="phase-progress">
                <span>{phase.progress}%</span>
                <div>
                  <span style={{ width: `${phase.progress}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="dashboard-panel risk-panel">
        <PanelHeader detail={`${delayedTasks.length + blockedTasks.length}件`} title="要確認" />
        <div className="risk-list">
          {riskTasks.map((task) => (
            <button
              className={`risk-row ${task.status}`}
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              type="button"
            >
              <span>{task.status === "delayed" ? "遅延" : "前提"}</span>
              <div>
                <strong>{task.title}</strong>
                <small>
                  {formatShortDate(task.start)} - {formatShortDate(task.end)}
                </small>
              </div>
            </button>
          ))}
          {riskTasks.length === 0 ? <EmptyDashboardRow label="要確認タスクはありません" /> : null}
        </div>
      </section>
    </>
  );
}

export function PanelHeader({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="dashboard-panel-header">
      <h2>{title}</h2>
      <span>{detail}</span>
    </div>
  );
}

export function EmptyDashboardRow({ label }: { label: string }) {
  return <div className="empty-dashboard-row">{label}</div>;
}
