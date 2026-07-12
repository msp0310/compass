import { useAuditLogs } from "../../hooks/useAuditLogs";
import { auditActionLabels, formatAuditDate, formatAuditTarget } from "../../model/masterSettings";

type AuditLogSectionProps = {
  active: boolean;
};

/** 監査ログの遅延取得結果を表形式で表示します。 */
export function AuditLogSection({ active }: AuditLogSectionProps) {
  const { auditLogs, loading } = useAuditLogs(active);

  return (
    <section className="settings-card audit-log-card" hidden={!active}>
      <div className="settings-card-heading">
        <strong>監査ログ</strong>
        <span>{loading ? "読み込み中" : `直近${auditLogs.length}件`}</span>
      </div>
      <div className="audit-log-table-wrap">
        <table className="audit-log-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>操作者</th>
              <th>操作</th>
              <th>対象</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{formatAuditDate(log.createdAt)}</td>
                <td>{log.userName}</td>
                <td>{auditActionLabels[log.action] ?? log.action}</td>
                <td>{formatAuditTarget(log)}</td>
                <td>{log.ipAddress ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && auditLogs.length === 0 ? (
          <p className="settings-empty">監査ログはまだありません。</p>
        ) : null}
      </div>
    </section>
  );
}
