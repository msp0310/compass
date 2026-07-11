import { requestJson } from "./apiClient";

export type AuditLog = {
  action: string;
  createdAt: string;
  detailJson?: string | null;
  id: string;
  ipAddress?: string | null;
  scopeId?: string | null;
  scopeType: string;
  targetId?: string | null;
  targetType?: string | null;
  userId: string;
  userName: string;
};

/** システム管理者向けの直近監査ログを取得します。 */
export function listAuditLogs(limit = 200) {
  return requestJson<AuditLog[]>(`/admin/audit-logs?limit=${Math.min(Math.max(limit, 1), 500)}`);
}
