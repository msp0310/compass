import overview from "./markdown/00-overview.md?raw";
import login from "./markdown/01-login.md?raw";
import projects from "./markdown/02-projects.md?raw";
import gantt from "./markdown/03-gantt.md?raw";
import status from "./markdown/04-status.md?raw";
import resource from "./markdown/05-resource.md?raw";
import calendar from "./markdown/06-calendar.md?raw";
import milestones from "./markdown/07-milestones.md?raw";
import activity from "./markdown/08-activity.md?raw";
import projectSettings from "./markdown/09-project-settings.md?raw";
import adminSettings from "./markdown/10-admin-settings.md?raw";
import importExport from "./markdown/11-import-export.md?raw";
import issues from "./markdown/12-issues.md?raw";
import dailyReports from "./markdown/13-daily-reports.md?raw";
import workLogs from "./markdown/14-worklogs.md?raw";
import analytics from "./markdown/15-analytics.md?raw";
import permissions from "./markdown/16-permissions.md?raw";

export type HelpDocumentId =
  | "overview"
  | "login"
  | "projects"
  | "gantt"
  | "status"
  | "resource"
  | "calendar"
  | "milestones"
  | "activity"
  | "projectSettings"
  | "adminSettings"
  | "importExport"
  | "issues"
  | "dailyReports"
  | "workLogs"
  | "analytics"
  | "permissions";

export type HelpDocument = {
  category: "基本" | "案件" | "設定";
  content: string;
  id: HelpDocumentId;
  title: string;
};

export const helpDocuments: HelpDocument[] = [
  { category: "基本", content: overview, id: "overview", title: "ヘルプの使い方" },
  { category: "基本", content: login, id: "login", title: "ログイン" },
  { category: "基本", content: permissions, id: "permissions", title: "権限とセキュリティ" },
  { category: "基本", content: dailyReports, id: "dailyReports", title: "日報" },
  { category: "基本", content: analytics, id: "analytics", title: "分析" },
  { category: "案件", content: projects, id: "projects", title: "案件一覧" },
  { category: "案件", content: gantt, id: "gantt", title: "ガント" },
  { category: "案件", content: status, id: "status", title: "概要" },
  { category: "案件", content: resource, id: "resource", title: "体制" },
  { category: "案件", content: calendar, id: "calendar", title: "カレンダー" },
  { category: "案件", content: milestones, id: "milestones", title: "マイルストーン" },
  { category: "案件", content: issues, id: "issues", title: "課題" },
  { category: "案件", content: workLogs, id: "workLogs", title: "作業時間" },
  { category: "案件", content: activity, id: "activity", title: "履歴" },
  { category: "設定", content: projectSettings, id: "projectSettings", title: "案件設定" },
  { category: "設定", content: adminSettings, id: "adminSettings", title: "管理設定" },
  { category: "設定", content: importExport, id: "importExport", title: "入出力" },
];
