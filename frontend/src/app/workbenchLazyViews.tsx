import { lazy } from "react";

// 初期表示に不要な業務画面はここでまとめて分割し、シェルの責務を画面制御に限定します。
export const ActivityPanel = lazy(() =>
  import("../features/activity/components/ActivityPanel").then((module) => ({
    default: module.ActivityPanel,
  })),
);
export const AnalysisPanel = lazy(() =>
  import("../features/analysis/components/AnalysisPanel").then((module) => ({
    default: module.AnalysisPanel,
  })),
);
export const WeeklyReportPanel = lazy(() =>
  import("../features/analysis/components/WeeklyReportPanel").then((module) => ({
    default: module.WeeklyReportPanel,
  })),
);
export const CalendarPanel = lazy(() =>
  import("../features/calendar/components/CalendarPanel").then((module) => ({
    default: module.CalendarPanel,
  })),
);
export const HelpPage = lazy(() =>
  import("../features/help/components/HelpPage").then((module) => ({ default: module.HelpPage })),
);
export const ProjectIssuePanel = lazy(() =>
  import("../features/issues/components/ProjectIssuePanel").then((module) => ({
    default: module.ProjectIssuePanel,
  })),
);
export const WorkLogPanel = lazy(() =>
  import("../features/worklogs/components/WorkLogPanel").then((module) => ({
    default: module.WorkLogPanel,
  })),
);
export const CreateTaskSheet = lazy(() =>
  import("../features/gantt/components/CreateTaskSheet").then((module) => ({
    default: module.CreateTaskSheet,
  })),
);
export const MilestonePanel = lazy(() =>
  import("../features/milestones/components/MilestonePanel").then((module) => ({
    default: module.MilestonePanel,
  })),
);
export const MasterSettingsPage = lazy(() =>
  import("../features/settings/components/MasterSettingsSheet").then((module) => ({
    default: module.MasterSettingsPage,
  })),
);
export const ProjectCreateSheet = lazy(() =>
  import("../features/projects/components/ProjectCreateSheet").then((module) => ({
    default: module.ProjectCreateSheet,
  })),
);
export const ProjectImportSheet = lazy(() =>
  import("../features/projects/components/ProjectImportSheet").then((module) => ({
    default: module.ProjectImportSheet,
  })),
);
export const ProjectPortfolioPanel = lazy(() =>
  import("../features/projects/components/ProjectPortfolioPanel").then((module) => ({
    default: module.ProjectPortfolioPanel,
  })),
);
export const ProjectSettingsPage = lazy(() =>
  import("../features/projects/components/ProjectSettingsSheet").then((module) => ({
    default: module.ProjectSettingsPage,
  })),
);
export const ResetDraftDialog = lazy(() =>
  import("../features/gantt/components/ResetDraftDialog").then((module) => ({
    default: module.ResetDraftDialog,
  })),
);
export const ResourcePanel = lazy(() =>
  import("../features/resource/components/ResourcePanel").then((module) => ({
    default: module.ResourcePanel,
  })),
);
export const WorkloadOverviewPage = lazy(() =>
  import("../features/resource/components/WorkloadOverviewPage").then((module) => ({
    default: module.WorkloadOverviewPage,
  })),
);
export const DailyReportPage = lazy(() =>
  import("../features/dailyReports/components/DailyReportPage").then((module) => ({
    default: module.DailyReportPage,
  })),
);
export const PersonalAnalyticsPage = lazy(() =>
  import("../features/personalAnalytics/components/PersonalAnalyticsPage").then((module) => ({
    default: module.PersonalAnalyticsPage,
  })),
);
export const SaveReviewDialog = lazy(() =>
  import("../features/gantt/components/SaveReviewDialog").then((module) => ({
    default: module.SaveReviewDialog,
  })),
);
export const ShortcutHelpSheet = lazy(() =>
  import("../features/gantt/components/ShortcutHelpSheet").then((module) => ({
    default: module.ShortcutHelpSheet,
  })),
);
export const SummaryStrip = lazy(() =>
  import("../features/status/components/SummaryStrip").then((module) => ({
    default: module.SummaryStrip,
  })),
);
export const BrabioTaskImportSheet = lazy(() =>
  import("../features/gantt/components/BrabioTaskImportSheet").then((module) => ({
    default: module.BrabioTaskImportSheet,
  })),
);
export const TaskCsvImportSheet = lazy(() =>
  import("../features/gantt/components/TaskCsvImportSheet").then((module) => ({
    default: module.TaskCsvImportSheet,
  })),
);
export const TaskInspector = lazy(() =>
  import("../features/gantt/components/TaskInspector").then((module) => ({
    default: module.TaskInspector,
  })),
);
