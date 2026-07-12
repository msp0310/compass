import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { AttachmentPanel } from "../../../components/common/AttachmentPanel";
import { MarkdownPreview } from "../../../components/common/MarkdownPreview";
import type {
  Attachment,
  Member,
  Project,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
} from "../../../types/schedule";
import {
  formatWorkLogDate,
  formatWorkLogDateTime,
  formatWorkLogHours,
  workLogCategoryLabels,
} from "../model/workLogs";

type WorkLogDetailPageProps = {
  attachments: Attachment[];
  issue: ProjectIssue | null;
  member: Member | null;
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentDeleted: (attachmentId: string) => void;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSelectTask: (taskId: string) => void;
  project: Project;
  task: ScheduleTask | null;
  workLog: ProjectWorkLog;
};

/** 作業ログのMarkdown本文、紐付け、添付を読み取り表示します。 */
export function WorkLogDetailPage(props: WorkLogDetailPageProps) {
  const { workLog } = props;
  const { task } = props;
  return (
    <article className="worklog-detail-page">
      <header className="worklog-detail-page-header">
        <button className="issue-back-button" onClick={props.onBack} type="button">
          <ArrowLeftIcon />
          一覧へ戻る
        </button>
        <div>
          <button className="issue-edit-button" onClick={props.onEdit} type="button">
            <PencilSquareIcon />
            編集
          </button>
          <button className="worklog-delete-button" onClick={props.onDelete} type="button">
            <TrashIcon />
            削除
          </button>
        </div>
      </header>
      <section className="worklog-read-view">
        <div className="worklog-read-title">
          <div>
            <span>{props.project.workspace}</span>
            <h3>{workLog.summary}</h3>
          </div>
          <span className={`worklog-category-badge ${workLog.category}`}>
            {workLogCategoryLabels[workLog.category]}
          </span>
        </div>
        <div className="worklog-read-meta">
          <span>{formatWorkLogDate(workLog.date)}</span>
          <span>{formatWorkLogHours(workLog.hours)}</span>
          <span>
            {props.member ? `${props.member.initials} ${props.member.name}` : workLog.memberId}
          </span>
          <span>更新 {formatWorkLogDateTime(workLog.updatedAt)}</span>
        </div>
        <div className="worklog-link-summary">
          {task ? (
            <button onClick={() => props.onSelectTask(task.id)} type="button">
              <CheckCircleIcon />
              <span>
                関連タスク<strong>{task.title}</strong>
              </span>
            </button>
          ) : null}
          {props.issue ? (
            <div>
              <ClockIcon />
              <span>
                関連課題<strong>{props.issue.title}</strong>
              </span>
            </div>
          ) : null}
          {!task && !props.issue ? (
            <span className="worklog-muted">関連タスク・課題は未設定です</span>
          ) : null}
        </div>
        <section className="worklog-note-section">
          <h4>対応内容</h4>
          <div className="issue-markdown-preview issue-markdown-preview-display worklog-note-preview">
            {workLog.note?.trim() ? (
              <MarkdownPreview content={workLog.note} />
            ) : (
              <span className="issue-muted">対応内容は未入力です</span>
            )}
          </div>
        </section>
        <AttachmentPanel
          attachments={props.attachments}
          onAttachmentAdded={props.onAttachmentAdded}
          onAttachmentDeleted={props.onAttachmentDeleted}
          ownerId={workLog.id}
          ownerType="workLog"
          projectId={props.project.id}
        />
      </section>
    </article>
  );
}
