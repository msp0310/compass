import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import type {
  Member,
  Project,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
  WorkLogCategory,
} from "../../../types/schedule";
import {
  formatWorkLogDate,
  formatWorkLogHours,
  formatWorkLogMonth,
  workLogCategoryLabels,
  workLogCategoryOptions,
} from "../model/workLogs";

type WorkLogListViewProps = {
  categoryFilter: WorkLogCategory | "all";
  issueById: Map<string, ProjectIssue>;
  memberById: Map<string, Member>;
  memberFilter: string;
  members: Member[];
  monthFilter: string;
  monthOptions: string[];
  onCategoryFilterChange: (value: WorkLogCategory | "all") => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onEdit: (workLog: ProjectWorkLog) => void;
  onMemberFilterChange: (value: string) => void;
  onMonthFilterChange: (value: string) => void;
  onOpenDetail: (id: string) => void;
  onQueryChange: (value: string) => void;
  onSelectTask: (id: string) => void;
  project: Project;
  query: string;
  summary: { activeMembers: number; operationHours: number; totalHours: number };
  taskById: Map<string, ScheduleTask>;
  workLogs: ProjectWorkLog[];
};

/** 作業ログの集計、検索条件、一覧表を表示します。 */
export function WorkLogListView(props: WorkLogListViewProps) {
  return (
    <section className="worklog-panel" aria-label="作業時間">
      <div className="worklog-header">
        <div>
          <span>{props.project.workspace}</span>
          <h2>作業時間</h2>
        </div>
        <button className="worklog-add-button" onClick={props.onCreate} type="button">
          <PlusIcon />
          時間を記録
        </button>
      </div>
      <div className="worklog-summary">
        <WorkLogStat label="表示中合計" value={formatWorkLogHours(props.summary.totalHours)} />
        <WorkLogStat label="保守系" value={formatWorkLogHours(props.summary.operationHours)} />
        <WorkLogStat label="担当者" value={`${props.summary.activeMembers}名`} />
      </div>
      <div className="worklog-table-card">
        <div className="worklog-toolbar">
          <label className="worklog-search">
            <MagnifyingGlassIcon />
            <input
              aria-label="作業時間検索"
              onChange={(event) => props.onQueryChange(event.target.value)}
              placeholder="内容・担当・タスク・課題を検索"
              value={props.query}
            />
          </label>
          <select
            aria-label="作業月"
            onChange={(event) => props.onMonthFilterChange(event.target.value)}
            value={props.monthFilter}
          >
            <option value="all">すべての月</option>
            {props.monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatWorkLogMonth(month)}
              </option>
            ))}
          </select>
          <select
            aria-label="担当者"
            onChange={(event) => props.onMemberFilterChange(event.target.value)}
            value={props.memberFilter}
          >
            <option value="all">すべての担当</option>
            {props.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            aria-label="分類"
            onChange={(event) =>
              props.onCategoryFilterChange(event.target.value as WorkLogCategory | "all")
            }
            value={props.categoryFilter}
          >
            <option value="all">すべての分類</option>
            {workLogCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {workLogCategoryLabels[category]}
              </option>
            ))}
          </select>
        </div>
        <div className="worklog-table-scroll">
          <table className="worklog-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>担当</th>
                <th>分類</th>
                <th>時間</th>
                <th>内容</th>
                <th>紐付け</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {props.workLogs.map((log) => {
                const task = log.taskId ? props.taskById.get(log.taskId) : undefined;
                const issue = log.issueId ? props.issueById.get(log.issueId) : undefined;
                return (
                  <tr key={log.id}>
                    <td>{formatWorkLogDate(log.date)}</td>
                    <td>{props.memberById.get(log.memberId)?.initials ?? log.memberId}</td>
                    <td>
                      <span className={`worklog-category-badge ${log.category}`}>
                        {workLogCategoryLabels[log.category]}
                      </span>
                    </td>
                    <td className="worklog-hours-cell">{formatWorkLogHours(log.hours)}</td>
                    <td className="worklog-summary-cell">
                      <button
                        className="worklog-summary-button"
                        onClick={() => props.onOpenDetail(log.id)}
                        type="button"
                      >
                        <strong>{log.summary}</strong>
                        {log.note ? <small>Markdownメモあり</small> : null}
                      </button>
                    </td>
                    <td className="worklog-link-cell">
                      {task ? (
                        <button onClick={() => props.onSelectTask(task.id)} type="button">
                          {task.title}
                        </button>
                      ) : issue ? (
                        <span>{issue.title}</span>
                      ) : (
                        <span className="worklog-muted">未設定</span>
                      )}
                    </td>
                    <td>
                      <div className="worklog-row-actions">
                        <button
                          aria-label={`${log.summary} を編集`}
                          onClick={() => props.onEdit(log)}
                          type="button"
                        >
                          <PencilSquareIcon />
                        </button>
                        <button
                          aria-label={`${log.summary} を削除`}
                          className="danger"
                          onClick={() => props.onDelete(log.id)}
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {props.workLogs.length === 0 ? (
            <div className="worklog-empty">
              <WrenchScrewdriverIcon />
              <strong>作業時間の記録はありません</strong>
              <span>保守対応、問い合わせ、障害調査などの実績を登録できます。</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WorkLogStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="worklog-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
