import type { AuthUser } from "../../../data/authRepository";
import type {
  Attachment,
  Member,
  Project,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
} from "../../../types/schedule";
import { useWorkLogController } from "../hooks/useWorkLogController";
import { WorkLogDetailPage } from "./WorkLogDetailPage";
import { WorkLogEditorPage } from "./WorkLogEditorPage";
import { WorkLogListView } from "./WorkLogListView";

type WorkLogPanelProps = {
  attachments: Attachment[];
  currentUser: AuthUser;
  issues: ProjectIssue[];
  members: Member[];
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentDeleted: (attachmentId: string) => void;
  onCreateWorkLog: (workLog: Partial<ProjectWorkLog>) => string;
  onDeleteWorkLog: (workLogId: string) => void;
  onSelectTask: (taskId: string) => void;
  onUpdateWorkLog: (workLogId: string, patch: Partial<ProjectWorkLog>) => void;
  project: Project;
  tasks: ScheduleTask[];
  workLogs: ProjectWorkLog[];
};

/** 作業ログの一覧、詳細、編集画面を調停します。 */
export function WorkLogPanel(props: WorkLogPanelProps) {
  const controller = useWorkLogController(props);

  if (controller.editorState) {
    return (
      <WorkLogEditorPage
        issues={props.issues}
        members={props.members}
        mode={controller.editorState.mode}
        onBack={() => controller.setEditorState(null)}
        onSave={controller.saveEditorWorkLog}
        onUpdate={(patch) =>
          controller.setEditorState((current) =>
            current ? { ...current, workLog: { ...current.workLog, ...patch } } : current,
          )
        }
        project={props.project}
        tasks={props.tasks}
        workLog={controller.editorState.workLog}
      />
    );
  }

  if (controller.detailWorkLog) {
    const workLog = controller.detailWorkLog;
    return (
      <WorkLogDetailPage
        attachments={props.attachments.filter(
          (attachment) => attachment.ownerType === "workLog" && attachment.ownerId === workLog.id,
        )}
        issue={workLog.issueId ? (controller.issueById.get(workLog.issueId) ?? null) : null}
        member={controller.memberById.get(workLog.memberId) ?? null}
        onAttachmentAdded={props.onAttachmentAdded}
        onAttachmentDeleted={props.onAttachmentDeleted}
        onBack={() => controller.openDetail(null)}
        onDelete={() => controller.deleteWorkLog(workLog.id)}
        onEdit={() => controller.openEdit(workLog)}
        onSelectTask={props.onSelectTask}
        project={props.project}
        task={workLog.taskId ? (controller.taskById.get(workLog.taskId) ?? null) : null}
        workLog={workLog}
      />
    );
  }

  return (
    <WorkLogListView
      categoryFilter={controller.categoryFilter}
      issueById={controller.issueById}
      memberById={controller.memberById}
      memberFilter={controller.memberFilter}
      members={props.members}
      monthFilter={controller.monthFilter}
      monthOptions={controller.monthOptions}
      onCategoryFilterChange={controller.setCategoryFilter}
      onCreate={controller.openCreate}
      onDelete={controller.deleteWorkLog}
      onEdit={controller.openEdit}
      onMemberFilterChange={controller.setMemberFilter}
      onMonthFilterChange={controller.setMonthFilter}
      onOpenDetail={controller.openDetail}
      onQueryChange={controller.setQuery}
      onSelectTask={props.onSelectTask}
      project={props.project}
      query={controller.query}
      summary={controller.summary}
      taskById={controller.taskById}
      workLogs={controller.filteredWorkLogs}
    />
  );
}
