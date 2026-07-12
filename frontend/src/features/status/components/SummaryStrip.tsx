import { useMemo } from "react";

import { BurndownChart } from "../../../components/charts/BurndownChart";
import type { ScheduleHealthIssue, ScheduleHealthReport } from "../../../lib/scheduleHealth";
import type {
  CalendarDefinition,
  Member,
  ProgressStats,
  Project,
  ResourceRowModel,
  ScheduleTask,
} from "../../../types/schedule";
import { buildProjectSummaryModel } from "../model/projectSummary";
import { HealthPanel } from "./summary/HealthPanel";
import { MilestoneLoadPanels } from "./summary/MilestoneLoadPanels";
import { StatusSummaryCards } from "./summary/StatusSummaryCards";
import { TaskProgressPanels } from "./summary/TaskProgressPanels";

type SummaryStripProps = {
  calendar: CalendarDefinition;
  calendarAware: boolean;
  healthReport: ScheduleHealthReport;
  members: Member[];
  onCaptureBaseline: () => void;
  onOpenHealthIssue: (issue: ScheduleHealthIssue) => void;
  onSelectTask: (taskId: string) => void;
  project: Project;
  resourceRows: ResourceRowModel[];
  stats: ProgressStats;
  tasks: ScheduleTask[];
};

/** 案件全体指標と、進捗・健全性・負荷の各パネルを構成します。 */
export function SummaryStrip(props: SummaryStripProps) {
  const model = useMemo(
    () => buildProjectSummaryModel(props),
    [
      props.calendar,
      props.calendarAware,
      props.healthReport,
      props.project,
      props.resourceRows,
      props.stats,
      props.tasks,
    ],
  );

  return (
    <section className="status-dashboard" aria-label="プロジェクト概要">
      <StatusSummaryCards
        blockedCount={model.blockedTasks.length}
        completedEffort={model.completedEffort}
        completionRate={model.completionRate}
        delayedTasks={model.delayedTasks}
        forecastTone={model.forecastTone}
        healthReport={props.healthReport}
        highLoadCount={model.highLoadRows.length}
        nextOpenMilestone={model.nextOpenMilestone}
        project={props.project}
        projectDays={model.projectDays}
        stats={props.stats}
        totalEffort={model.totalEffort}
        workingDays={model.workingDays}
      />
      <div className="dashboard-grid">
        <BurndownChart
          baselineCapturedAt={model.baselineCapturedAt}
          calendar={props.calendar}
          calendarAware={props.calendarAware}
          hasBaseline={model.hasBaseline}
          onCaptureBaseline={props.onCaptureBaseline}
          projectEnd={props.project.rangeEnd}
          projectStart={props.project.rangeStart}
          tasks={props.tasks}
        />
        <TaskProgressPanels
          blockedTasks={model.blockedTasks}
          delayedTasks={model.delayedTasks}
          onSelectTask={props.onSelectTask}
          phases={model.phases}
        />
        <HealthPanel
          healthReport={props.healthReport}
          onOpenHealthIssue={props.onOpenHealthIssue}
        />
        <MilestoneLoadPanels
          members={props.members}
          milestones={model.milestones}
          onSelectTask={props.onSelectTask}
          resourceRows={props.resourceRows}
        />
      </div>
    </section>
  );
}
