import type { DailyReport, DailyReportReminder } from "../types/schedule";
import { requestJson } from "./apiClient";
import { authRepository } from "./authRepository";

function authenticatedHeaders() {
  const token = authRepository.getAccessToken();
  if (!token) throw new Error("ログインが必要です。");
  return { Authorization: `Bearer ${token}` };
}

export function listDailyReports(teamId?: string) {
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return requestJson<DailyReport[]>(`/daily-reports${query}`, { headers: authenticatedHeaders() });
}

export function addDailyReportComment(reportId: string, body: string) {
  return requestJson<DailyReport>(`/daily-reports/${reportId}/comments`, {
    body: JSON.stringify({ body }),
    headers: authenticatedHeaders(),
    method: "POST",
  });
}

export function markDailyReportRead(reportId: string) {
  return requestJson<void>(`/daily-reports/${reportId}/read`, {
    headers: authenticatedHeaders(),
    method: "POST",
  });
}

export function listDailyReportReminders() {
  return requestJson<DailyReportReminder[]>("/daily-reports/reminders", {
    headers: authenticatedHeaders(),
  });
}

export function sendDailyReportReminders(teamId: string, date: string, memberIds: string[]) {
  return requestJson<DailyReportReminder[]>("/daily-reports/reminders", {
    body: JSON.stringify({ date, memberIds, teamId }),
    headers: authenticatedHeaders(),
    method: "POST",
  });
}

export function markDailyReportReminderRead(reminderId: string) {
  return requestJson<void>(`/daily-reports/reminders/${reminderId}/read`, {
    headers: authenticatedHeaders(),
    method: "POST",
  });
}

export function saveDailyReport(report: DailyReport) {
  return requestJson<DailyReport>(`/daily-reports/${report.id}`, {
    body: JSON.stringify({
      blockers: report.blockers,
      comments: report.comments,
      date: report.date,
      entries: report.entries,
      memberId: report.memberId,
      nextPlan: report.nextPlan,
      status: report.status,
      summary: report.summary,
      version: report.version,
    }),
    headers: authenticatedHeaders(),
    method: "PUT",
  });
}

export function deleteDailyReport(reportId: string) {
  return requestJson<void>(`/daily-reports/${reportId}`, {
    headers: authenticatedHeaders(),
    method: "DELETE",
  });
}
