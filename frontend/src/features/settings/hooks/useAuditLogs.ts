import { useEffect, useState } from "react";

import { type AuditLog, listAuditLogs } from "../../../data/administrationRepository";

/** 監査ログは監査タブが表示された時だけ遅延取得します。 */
export function useAuditLogs(active: boolean) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    setLoading(true);
    listAuditLogs()
      .then(setAuditLogs)
      .catch(() => setAuditLogs([]))
      .finally(() => setLoading(false));
  }, [active]);

  return { auditLogs, loading };
}
