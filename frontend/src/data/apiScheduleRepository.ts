import type {
  ScheduleRepository,
  ScheduleRepositorySaveOptions,
  ScheduleRepositorySaveResult,
  ScheduleRepositorySyncStatus,
  ScheduleSnapshot,
  ScheduleWorkspace,
  ScheduleWorkspaceSummary,
  ProjectSummary,
} from "./scheduleRepository";
import { authRepository } from "./authRepository";

/** APIがHTTPエラーを返したことを表す、画面で判定可能なエラーです。 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type SaveScheduleResponse = {
  mode: "remote";
  revision: string;
  savedAt: string;
  schedule: ScheduleSnapshot;
};

const apiBaseUrl = (import.meta.env.VITE_SCHEDULE_API_BASE_URL ?? "/api").replace(/\/$/, "");
const requestTimeoutMs = 20_000;

/** 認証ヘッダーを付与し、タイムアウト付きでAPI JSONを取得します。 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const accessToken = authRepository.getAccessToken();
  headers.set("Accept", "application/json");
  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal: init?.signal ?? controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ApiRequestError(body || `${response.status} ${response.statusText}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("APIへの接続がタイムアウトしました。再試行してください。", 408);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export const apiScheduleRepository: ScheduleRepository = {
  /** 案件一覧用の軽量集計だけを取得します。 */
  async getProjectSummaries() {
    return requestJson<ProjectSummary[]>("/projects/summary");
  },

  /** 既存互換用に全ワークスペースを取得します。詳細画面では遅延取得を優先します。 */
  async getWorkspace() {
    return requestJson<ScheduleWorkspace>("/workspace");
  },

  /** 案件一覧向けに、詳細タスクを除いた初期データを取得します。 */
  async getWorkspaceSummary() {
    return requestJson<ScheduleWorkspaceSummary>("/workspace/summary");
  },

  /** 指定案件の詳細スケジュールを取得します。 */
  async getProjectSchedule(projectId) {
    return requestJson<ScheduleSnapshot>(`/projects/${encodeURIComponent(projectId)}/schedule`);
  },

  /** APIのヘルスチェックを行い、同期表示用の状態を返します。 */
  async getSyncStatus(): Promise<ScheduleRepositorySyncStatus> {
    await requestJson("/health");
    return {
      connected: true,
      endpointLabel: apiBaseUrl,
      lastSyncedAt: new Date().toISOString(),
      mode: "remote",
      pendingChangeCount: 0,
      providerLabel: "ASP.NET Core + SQLite",
    };
  },

  /** 選択案件の内容だけをプロジェクト単位で保存します。 */
  async saveWorkspace(
    workspace: ScheduleWorkspace,
    options: ScheduleRepositorySaveOptions,
  ): Promise<ScheduleRepositorySaveResult> {
    const schedule = workspace.schedules.find(
      (snapshot) => snapshot.project.id === options.activeProjectId,
    );
    if (!schedule) {
      throw new Error(`保存対象のプロジェクトが見つかりません: ${options.activeProjectId}`);
    }

    const result = await requestJson<SaveScheduleResponse>(
      `/projects/${encodeURIComponent(options.activeProjectId)}/schedule`,
      {
        body: JSON.stringify({
          calendar: schedule.calendar,
          expectedVersion: schedule.project.version ?? null,
          issues: schedule.issues ?? [],
          members: schedule.members,
          project: schedule.project,
          tasks: schedule.tasks,
          workLogs: schedule.workLogs ?? [],
        }),
        method: "PUT",
      },
    );

    return {
      mode: "remote",
      revision: result.revision,
      savedAt: result.savedAt,
      workspace: {
        ...workspace,
        schedules: workspace.schedules.map((snapshot) =>
          snapshot.project.id === result.schedule.project.id ? result.schedule : snapshot,
        ),
      },
    };
  },
};
