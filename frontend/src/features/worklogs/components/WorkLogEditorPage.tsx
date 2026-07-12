import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { MarkdownPreview } from "../../../components/common/MarkdownPreview";
import type {
  Member,
  Project,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
  WorkLogCategory,
} from "../../../types/schedule";
import { workLogCategoryLabels, workLogCategoryOptions } from "../model/workLogs";

type WorkLogEditorPageProps = {
  issues: ProjectIssue[];
  members: Member[];
  mode: "create" | "edit";
  onBack: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<ProjectWorkLog>) => void;
  project: Project;
  tasks: ScheduleTask[];
  workLog: ProjectWorkLog;
};

/** 作業ログの本文、日付、担当、分類、関連先を編集します。 */
export function WorkLogEditorPage(props: WorkLogEditorPageProps) {
  const [noteMode, setNoteMode] = useState<"edit" | "preview">("edit");
  return (
    <article className="worklog-editor-page">
      <header className="worklog-detail-page-header">
        <button className="issue-back-button" onClick={props.onBack} type="button">
          <ArrowLeftIcon />
          一覧へ戻る
        </button>
        <button className="worklog-add-button" onClick={props.onSave} type="button">
          {props.mode === "create" ? "記録する" : "保存"}
        </button>
      </header>
      <div className="worklog-editor-heading">
        <span>{props.project.workspace}</span>
        <h2>{props.mode === "create" ? "作業時間を記録" : "作業時間を編集"}</h2>
      </div>
      <div className="worklog-editor-layout">
        <section className="worklog-editor-main">
          <label className="worklog-field">
            内容
            <input
              onChange={(event) => props.onUpdate({ summary: event.target.value })}
              placeholder="例: 月次データ取込エラーの調査"
              value={props.workLog.summary}
            />
          </label>
          <section className="issue-markdown-field worklog-markdown-field">
            <div className="issue-markdown-heading">
              <span>対応内容</span>
              <div className="issue-markdown-tabs" role="tablist">
                <button
                  className={noteMode === "edit" ? "active" : ""}
                  onClick={() => setNoteMode("edit")}
                  type="button"
                >
                  編集
                </button>
                <button
                  className={noteMode === "preview" ? "active" : ""}
                  onClick={() => setNoteMode("preview")}
                  type="button"
                >
                  プレビュー
                </button>
              </div>
            </div>
            {noteMode === "edit" ? (
              <textarea
                className="issue-markdown-editor worklog-markdown-editor"
                onChange={(event) => props.onUpdate({ note: event.target.value })}
                placeholder={"## 対応内容\n- 事象\n- 対応\n- 次回確認"}
                value={props.workLog.note ?? ""}
              />
            ) : (
              <div className="issue-markdown-preview worklog-markdown-preview">
                {props.workLog.note?.trim() ? (
                  <MarkdownPreview content={props.workLog.note} />
                ) : (
                  <span className="issue-muted">対応内容は未入力です</span>
                )}
              </div>
            )}
          </section>
        </section>
        <aside className="worklog-editor-side">
          <label className="worklog-field">
            日付
            <input
              onChange={(event) => props.onUpdate({ date: event.target.value })}
              type="date"
              value={props.workLog.date}
            />
          </label>
          <label className="worklog-field">
            時間
            <input
              min="0"
              onChange={(event) => props.onUpdate({ hours: Number(event.target.value) })}
              step="0.25"
              type="number"
              value={props.workLog.hours}
            />
          </label>
          <label className="worklog-field">
            担当者
            <select
              onChange={(event) => props.onUpdate({ memberId: event.target.value })}
              value={props.workLog.memberId}
            >
              {props.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.initials} {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="worklog-field">
            分類
            <select
              onChange={(event) =>
                props.onUpdate({ category: event.target.value as WorkLogCategory })
              }
              value={props.workLog.category}
            >
              {workLogCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {workLogCategoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
          <label className="worklog-field">
            関連タスク
            <select
              onChange={(event) => props.onUpdate({ taskId: event.target.value || undefined })}
              value={props.workLog.taskId ?? ""}
            >
              <option value="">未設定</option>
              {props.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label className="worklog-field">
            関連課題
            <select
              onChange={(event) => props.onUpdate({ issueId: event.target.value || undefined })}
              value={props.workLog.issueId ?? ""}
            >
              <option value="">未設定</option>
              {props.issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.title}
                </option>
              ))}
            </select>
          </label>
        </aside>
      </div>
    </article>
  );
}
