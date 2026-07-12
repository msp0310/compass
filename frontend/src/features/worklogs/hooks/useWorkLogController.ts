import { useMemo, useState } from "react";

import type { AuthUser } from "../../../data/authRepository";
import type {
  Member,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
  WorkLogCategory,
} from "../../../types/schedule";
import {
  buildWorkLogMonthOptions,
  createBlankWorkLogDraft,
  filterWorkLogs,
  getWorkLogSummary,
  normalizeWorkLogDraft,
  type WorkLogEditorState,
} from "../model/workLogs";

type UseWorkLogControllerOptions = {
  currentUser: AuthUser;
  issues: ProjectIssue[];
  members: Member[];
  onCreateWorkLog: (workLog: Partial<ProjectWorkLog>) => string;
  onDeleteWorkLog: (workLogId: string) => void;
  onUpdateWorkLog: (workLogId: string, patch: Partial<ProjectWorkLog>) => void;
  tasks: ScheduleTask[];
  workLogs: ProjectWorkLog[];
};

/** 作業ログの絞り込み、一覧・詳細・編集遷移、更新操作を管理します。 */
export function useWorkLogController({
  currentUser,
  issues,
  members,
  onCreateWorkLog,
  onDeleteWorkLog,
  onUpdateWorkLog,
  tasks,
  workLogs,
}: UseWorkLogControllerOptions) {
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<WorkLogCategory | "all">("all");
  const [detailWorkLogId, setDetailWorkLogId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<WorkLogEditorState | null>(null);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const issueById = useMemo(() => new Map(issues.map((issue) => [issue.id, issue])), [issues]);
  const monthOptions = useMemo(() => buildWorkLogMonthOptions(workLogs), [workLogs]);
  const filteredWorkLogs = useMemo(
    () =>
      filterWorkLogs(
        workLogs,
        { category: categoryFilter, memberId: memberFilter, month: monthFilter, query },
        memberById,
        taskById,
        issueById,
      ),
    [categoryFilter, issueById, memberById, memberFilter, monthFilter, query, taskById, workLogs],
  );
  const summary = useMemo(() => getWorkLogSummary(filteredWorkLogs), [filteredWorkLogs]);
  const detailWorkLog = detailWorkLogId
    ? (workLogs.find((workLog) => workLog.id === detailWorkLogId) ?? null)
    : null;

  function saveEditorWorkLog() {
    if (!editorState) {
      return;
    }
    const workLog = normalizeWorkLogDraft(editorState.workLog);
    let { id } = workLog;
    if (editorState.mode === "create") {
      id = onCreateWorkLog(workLog);
    } else {
      onUpdateWorkLog(workLog.id, workLog);
    }
    setDetailWorkLogId(id);
    setEditorState(null);
  }

  function deleteWorkLog(workLogId: string) {
    onDeleteWorkLog(workLogId);
    if (detailWorkLogId === workLogId) {
      setDetailWorkLogId(null);
    }
  }

  return {
    categoryFilter,
    deleteWorkLog,
    detailWorkLog,
    editorState,
    filteredWorkLogs,
    issueById,
    memberById,
    memberFilter,
    monthFilter,
    monthOptions,
    openCreate: () =>
      setEditorState({ mode: "create", workLog: createBlankWorkLogDraft(members, currentUser) }),
    openDetail: setDetailWorkLogId,
    openEdit: (workLog: ProjectWorkLog) =>
      setEditorState({ mode: "edit", workLog: { ...workLog } }),
    query,
    saveEditorWorkLog,
    setCategoryFilter,
    setEditorState,
    setMemberFilter,
    setMonthFilter,
    setQuery,
    summary,
    taskById,
  };
}
