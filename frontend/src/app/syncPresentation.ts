import type { TopbarSyncQueueItem, TopbarSyncStatus } from "../components/layout/Topbar";
import type { ConfigChangeReview, TaskChangeReview } from "../lib/changeReview";
import type { LocalDraftChangeSummary } from "../types/schedule";
import type { ApiSyncState } from "./appTypes";

/** 未保存・送信中・同期済みの状態を、ヘッダー表示用モデルへ変換します。 */
export function createTopbarSyncStatus(input: {
  apiSyncState: ApiSyncState;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  pendingConfigChangeCount: number;
  pendingLocalDraftChangeCount: number;
  pendingLocalDraftChangeDetail: string;
  pendingTaskChangeCount: number;
  scopeLabel: string;
}): TopbarSyncStatus {
  if (input.hasUnsavedChanges) {
    const pendingCount = Math.max(
      input.pendingTaskChangeCount +
        input.pendingConfigChangeCount +
        input.pendingLocalDraftChangeCount,
      1,
    );
    const hasProjectLocalDraft = /作業時間|課題/.test(input.pendingLocalDraftChangeDetail);
    const hasViewLocalDraft =
      /表示中プロジェクト|表示タブ|Ganttビュー|Gantt表示設定|Resource表示設定|お気に入り/.test(
        input.pendingLocalDraftChangeDetail,
      );
    const localDraftLabel =
      hasProjectLocalDraft && hasViewLocalDraft
        ? "案件・表示差分"
        : hasProjectLocalDraft
          ? "案件差分"
          : "表示状態";
    const detailParts = [
      input.pendingTaskChangeCount > 0 ? `タスク差分${input.pendingTaskChangeCount}行` : null,
      input.pendingConfigChangeCount > 0 ? `設定差分${input.pendingConfigChangeCount}件` : null,
      input.pendingLocalDraftChangeCount > 0
        ? `${localDraftLabel}${input.pendingLocalDraftChangeCount}件`
        : null,
    ].filter(Boolean);
    return {
      detail:
        detailParts.length > 0
          ? `${detailParts.join(" / ")}が保存待ちです。${
              input.pendingLocalDraftChangeDetail
                ? `対象: ${input.pendingLocalDraftChangeDetail}。`
                : ""
            }保存後にAPI送信キューへ渡します。`
          : "表示設定や履歴など、ローカル保存待ちの変更があります。",
      endpointLabel: "Schedule.Api /api",
      lastSyncedAt: input.lastSavedAt,
      modeLabel: "API",
      pendingChangeCount: pendingCount,
      providerLabel: "ASP.NET Core + SQLite",
      scopeLabel: input.scopeLabel,
      status: "dirty",
      title: "未保存",
    };
  }

  if (input.apiSyncState.status === "sending") {
    return {
      detail: "変更をAPIへ送信しています。",
      endpointLabel: "Schedule.Api /api",
      lastSyncedAt: input.apiSyncState.lastAttemptAt,
      modeLabel: "送信中",
      pendingChangeCount: input.apiSyncState.queuedChangeCount,
      providerLabel: "ASP.NET Core + SQLite",
      scopeLabel: input.scopeLabel,
      status: "saving",
      title: "送信中",
    };
  }

  if (input.apiSyncState.status === "failed") {
    return {
      detail: input.apiSyncState.error ?? "API送信に失敗しました。画面の未保存内容を再送できます。",
      endpointLabel: "Schedule.Api /api",
      lastSyncedAt: input.apiSyncState.lastAttemptAt,
      modeLabel: "再送待ち",
      pendingChangeCount: Math.max(input.apiSyncState.queuedChangeCount, 1),
      providerLabel: "ASP.NET Core + SQLite",
      scopeLabel: input.scopeLabel,
      status: "error",
      title: "同期失敗",
    };
  }

  return {
    detail: input.lastSavedAt
      ? input.apiSyncState.status === "synced"
        ? "APIへの保存が完了しています。"
        : "APIから取得した作業状態を表示しています。"
      : "APIから取得したプロジェクトデータを表示しています。",
    endpointLabel: "Schedule.Api /api",
    lastSyncedAt: input.apiSyncState.lastSuccessAt ?? input.lastSavedAt,
    modeLabel: "API",
    pendingChangeCount: 0,
    providerLabel: "ASP.NET Core + SQLite",
    scopeLabel: input.scopeLabel,
    status: "synced",
    title: "保存済み",
  };
}

/** 保存前レビューとAPI送信状態を、ヘッダーのキュー表示用にまとめます。 */
export function buildTopbarSyncQueueItems(input: {
  apiSyncState: ApiSyncState;
  configChangeReview: ConfigChangeReview;
  hasUnsavedChanges: boolean;
  localDraftChangeSummary: LocalDraftChangeSummary;
  taskChangeReview: TaskChangeReview;
}): TopbarSyncQueueItem[] {
  const items: TopbarSyncQueueItem[] = [];
  if (input.hasUnsavedChanges) {
    const hasTaskChanges = input.taskChangeReview.totalCount > 0;
    const hasConfigChanges = input.configChangeReview.totalCount > 0;
    const detailParts = [
      hasTaskChanges
        ? `${input.taskChangeReview.totalCount}行 / ${input.taskChangeReview.fieldChangeCount}項目のタスク差分`
        : null,
      hasConfigChanges
        ? `${input.configChangeReview.totalCount}件 / ${input.configChangeReview.fieldChangeCount}項目の設定差分`
        : null,
      input.localDraftChangeSummary.count > 0
        ? `${input.localDraftChangeSummary.count}件の表示状態`
        : null,
    ].filter(Boolean);
    items.push({
      detail:
        detailParts.length > 0
          ? detailParts.join(" / ")
          : "表示設定、履歴、ナビゲーションなどのローカル変更",
      id: "local-draft",
      status: "pending",
      title:
        hasTaskChanges || hasConfigChanges
          ? "変更レビューを保存待ち"
          : input.localDraftChangeSummary.count > 0
            ? "表示状態を保存待ち"
            : "ワークスペース変更を保存待ち",
    });
  }

  if (input.apiSyncState.status === "sending") {
    items.push({
      detail: `${input.apiSyncState.queuedChangeCount}件をAPIへ送信中`,
      id: "api-sending",
      status: "sending",
      title: "API送信中",
      updatedAt: input.apiSyncState.lastAttemptAt,
    });
  }

  if (input.apiSyncState.status === "failed") {
    items.push({
      detail:
        input.apiSyncState.error ?? `${input.apiSyncState.queuedChangeCount}件がAPI再送待ちです`,
      id: "api-failed",
      status: "failed",
      title: "API再送待ち",
      updatedAt: input.apiSyncState.lastAttemptAt,
    });
  }

  if (!input.hasUnsavedChanges && input.apiSyncState.status === "synced") {
    items.push({
      detail: "最後の送信は正常に完了しました",
      id: "api-synced",
      status: "synced",
      title: "API送信済み",
      updatedAt: input.apiSyncState.lastSuccessAt,
    });
  }

  return items;
}
