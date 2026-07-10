import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { apiScheduleRepository } from "../data/apiScheduleRepository";
import { saveLocalScheduleDraft } from "../data/localScheduleStorage";
import { createDraftSignature } from "./appState";
import type { ApiSyncState, PersistableDraft } from "./appTypes";
import type { ApiConnectionMode } from "../components/layout/Topbar";
import type { ScheduleWorkspace } from "../data/scheduleRepository";

type UseScheduleSyncOptions = {
  addToast: (input: {
    detail?: string;
    title: string;
    tone?: "info" | "success" | "warning";
  }) => void;
  apiConnectionModeRef: MutableRefObject<ApiConnectionMode>;
  apiSyncState: ApiSyncState;
  hasUnsavedChangesRef: MutableRefObject<boolean>;
  requestSaveDraft: () => void;
  saveOperationIdRef: MutableRefObject<number>;
  savedDraftRef: MutableRefObject<PersistableDraft>;
  setApiConnectionMode: Dispatch<SetStateAction<ApiConnectionMode>>;
  setApiSyncState: Dispatch<SetStateAction<ApiSyncState>>;
  setLastSavedAt: Dispatch<SetStateAction<string | null>>;
  setSavedSignature: Dispatch<SetStateAction<string>>;
  setSavedWorkspace: Dispatch<SetStateAction<ScheduleWorkspace>>;
  setWorkspace: Dispatch<SetStateAction<ScheduleWorkspace>>;
};

/**
 * ローカル保存とSchedule APIへの同期状態を管理します。
 * 送信中の競合、オフライン保留、再送を画面本体から分離します。
 */
export function useScheduleSync({
  addToast,
  apiConnectionModeRef,
  apiSyncState,
  hasUnsavedChangesRef,
  requestSaveDraft,
  saveOperationIdRef,
  savedDraftRef,
  setApiConnectionMode,
  setApiSyncState,
  setLastSavedAt,
  setSavedSignature,
  setSavedWorkspace,
  setWorkspace,
}: UseScheduleSyncOptions) {
  /** changeApiConnectionModeを実行します。 */
  function changeApiConnectionMode(mode: ApiConnectionMode) {
    setApiConnectionMode(mode);
    addToast({
      detail:
        mode === "online" ? "Schedule APIへの保存を有効にしました" : "API保存を一時停止しました",
      title: mode === "online" ? "API online" : "API offline",
      tone: mode === "online" ? "success" : "warning",
    });
  }

  /** scheduleApiSyncを実行します。 */
  async function scheduleApiSync(
    draftToSync: PersistableDraft,
    changeCount: number,
    mode: "save" | "retry" = "save",
  ) {
    const operationId = saveOperationIdRef.current + 1;
    saveOperationIdRef.current = operationId;
    const queuedChangeCount = Math.max(changeCount, 1);
    const attemptAt = new Date().toISOString();
    setApiSyncState((current) => ({
      ...current,
      error: null,
      lastAttemptAt: attemptAt,
      queuedChangeCount,
      status: "sending",
    }));

    if (apiConnectionModeRef.current === "offline") {
      const errorMessage = "API offlineのため送信を保留しました。";
      setApiSyncState((current) => ({
        ...current,
        error: errorMessage,
        lastAttemptAt: attemptAt,
        queuedChangeCount,
        status: "failed",
      }));
      addToast({
        detail: "ローカル保存済みです。API onlineに戻して再送できます。",
        title: "API送信を保留しました",
        tone: "warning",
      });
      return;
    }

    try {
      const result = await apiScheduleRepository.saveWorkspace(draftToSync.workspace, {
        activeProjectId: draftToSync.activeProjectId,
        activeTeamId: draftToSync.activeTeamId,
        reason: "manual",
      });
      if (saveOperationIdRef.current !== operationId) return;
      const successAt = new Date().toISOString();
      const syncedDraft = { ...draftToSync, workspace: result.workspace };
      const saved = saveLocalScheduleDraft(syncedDraft);
      savedDraftRef.current = syncedDraft;
      setWorkspace(result.workspace);
      setLastSavedAt(saved.savedAt);
      setSavedSignature(createDraftSignature(syncedDraft));
      setSavedWorkspace(result.workspace);
      setApiSyncState({
        error: null,
        lastAttemptAt: attemptAt,
        lastSuccessAt: successAt,
        queuedChangeCount: 0,
        status: "synced",
      });
      addToast({
        detail:
          mode === "retry"
            ? `${queuedChangeCount}件をAPIへ再送しました`
            : `${draftToSync.activeProjectId} を ${result.revision} として保存しました`,
        title: "API送信が完了しました",
      });
    } catch (error) {
      if (saveOperationIdRef.current !== operationId) return;
      const errorMessage =
        error instanceof Error ? error.message : "API送信中に不明なエラーが発生しました。";
      setApiSyncState((current) => ({
        ...current,
        error: errorMessage,
        lastAttemptAt: attemptAt,
        queuedChangeCount,
        status: "failed",
      }));
      addToast({
        detail: "ローカル保存済みです。内容を確認して再送できます。",
        title: "API送信に失敗しました",
        tone: "warning",
      });
    }
  }

  /** retryApiSyncを実行します。 */
  function retryApiSync() {
    if (apiSyncState.status === "sending") return;
    if (hasUnsavedChangesRef.current) {
      requestSaveDraft();
      return;
    }
    if (apiSyncState.status !== "failed") {
      addToast({
        detail: "再送待ちのキューはありません",
        title: "API再送は不要です",
        tone: "info",
      });
      return;
    }
    void scheduleApiSync(savedDraftRef.current, apiSyncState.queuedChangeCount, "retry");
  }

  return { changeApiConnectionMode, retryApiSync, scheduleApiSync };
}
