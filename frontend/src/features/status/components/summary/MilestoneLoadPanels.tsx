import { formatShortDate, statusLabels } from "../../../../lib/schedule";
import type { Member, ResourceRowModel, ScheduleTask } from "../../../../types/schedule";
import { getLoadTone } from "../../model/projectSummary";
import { PanelHeader } from "./TaskProgressPanels";

type MilestoneLoadPanelsProps = {
  members: Member[];
  milestones: ScheduleTask[];
  onSelectTask: (taskId: string) => void;
  resourceRows: ResourceRowModel[];
};

export function MilestoneLoadPanels({
  members,
  milestones,
  onSelectTask,
  resourceRows,
}: MilestoneLoadPanelsProps) {
  return (
    <>
      <section className="dashboard-panel milestone-dashboard-panel">
        <PanelHeader detail={`${milestones.length}件`} title="マイルストーン" />
        <div className="dashboard-timeline">
          {milestones.slice(0, 5).map((milestone) => (
            <button
              className={`timeline-item ${milestone.status}`}
              key={milestone.id}
              onClick={() => onSelectTask(milestone.id)}
              type="button"
            >
              <span>{formatShortDate(milestone.start)}</span>
              <div>
                <strong>{milestone.title}</strong>
                <small>{statusLabels[milestone.status]}</small>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="dashboard-panel load-panel">
        <PanelHeader detail={`${members.length}名`} title="チーム負荷" />
        <div className="load-list">
          {resourceRows.slice(0, 6).map((row) => (
            <div className="load-row" key={row.member.id}>
              <div>
                <strong>{row.member.name}</strong>
                <small>{row.member.role}</small>
              </div>
              <div className={`load-meter load-${getLoadTone(row.utilization)}`}>
                <span>{row.utilization}%</span>
                <div>
                  <span style={{ width: `${Math.min(row.utilization, 120)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
