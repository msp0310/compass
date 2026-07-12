import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import type { DailyReportEntry, ScheduleTask } from "../../../types/schedule";
import { createDailyReportEntry, sumDailyReportHours } from "../model/dailyReports";

import * as styles from "./DailyReportPage.css";

type DailyReportEntriesProps = {
  entries: DailyReportEntry[];
  onChange: (entries: DailyReportEntry[]) => void;
  readOnly: boolean;
  schedules: ScheduleSnapshot[];
};

function firstTask(schedule: ScheduleSnapshot | undefined) {
  return schedule?.tasks.find((task) => task.type === "task");
}

function taskPatch(task: ScheduleTask | undefined) {
  return {
    previousActualEnd: undefined,
    previousActualStart: undefined,
    previousProgress: undefined,
    previousStatus: undefined,
    progress: task?.progress ?? 0,
    taskId: task?.id,
  };
}

/** 日報からタスクへ反映する進捗・実績時間・作業内容を編集します。 */
export function DailyReportEntries({
  entries,
  onChange,
  readOnly,
  schedules,
}: DailyReportEntriesProps) {
  function updateEntry(entryId: string, patch: Partial<DailyReportEntry>) {
    onChange(entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)));
  }

  return (
    <section className={styles.entrySection}>
      <header className={styles.sectionHeader}>
        <div>
          <strong>タスク実績</strong>
          <span>合計 {sumDailyReportHours(entries)}h・提出時にタスクへ反映</span>
        </div>
        <button
          className={styles.secondaryButton}
          disabled={readOnly}
          onClick={() => {
            const [schedule] = schedules;
            onChange([
              ...entries,
              createDailyReportEntry(schedule?.project.id ?? "", firstTask(schedule)),
            ]);
          }}
          type="button"
        >
          <PlusIcon className={styles.buttonIcon} />
          タスク追加
        </button>
      </header>
      <div className={styles.entryLabels} aria-hidden="true">
        <span>案件</span>
        <span>タスク</span>
        <span>進捗</span>
        <span>時間</span>
        <span />
      </div>
      {entries.map((entry) => {
        const schedule = schedules.find((item) => item.project.id === entry.projectId);
        return (
          <div className={styles.entry} key={entry.id}>
            <select
              aria-label="案件"
              className={styles.select}
              disabled={readOnly}
              onChange={(event) => {
                const nextSchedule = schedules.find(
                  (item) => item.project.id === event.target.value,
                );
                updateEntry(entry.id, {
                  projectId: event.target.value,
                  ...taskPatch(firstTask(nextSchedule)),
                });
              }}
              value={entry.projectId}
            >
              {schedules.map((item) => (
                <option key={item.project.id} value={item.project.id}>
                  {item.project.workspace}
                </option>
              ))}
            </select>
            <select
              aria-label="タスク"
              className={styles.select}
              disabled={readOnly}
              onChange={(event) => {
                const task = schedule?.tasks.find(
                  (candidate) => candidate.id === event.target.value,
                );
                updateEntry(entry.id, taskPatch(task));
              }}
              value={entry.taskId ?? ""}
            >
              <option value="">タスクを選択</option>
              {schedule?.tasks
                .filter((task) => task.type === "task")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            <label className={styles.progressInput}>
              <input
                aria-label="進捗"
                disabled={readOnly}
                max="100"
                min="0"
                onChange={(event) =>
                  updateEntry(entry.id, {
                    progress: Math.min(100, Math.max(0, Number(event.target.value))),
                  })
                }
                step="1"
                type="number"
                value={entry.progress ?? 0}
              />
              <span>%</span>
            </label>
            <input
              aria-label="作業時間"
              className={styles.hoursInput}
              disabled={readOnly}
              min="0.25"
              onChange={(event) => updateEntry(entry.id, { hours: Number(event.target.value) })}
              step="0.25"
              type="number"
              value={entry.hours}
            />
            <input
              aria-label="作業内容"
              className={styles.summaryInput}
              disabled={readOnly}
              onChange={(event) => updateEntry(entry.id, { summary: event.target.value })}
              placeholder="作業内容・確認結果・次のアクション"
              value={entry.summary}
            />
            <button
              aria-label="タスク実績を削除"
              className={`${styles.iconButton} ${styles.entryDelete}`}
              disabled={readOnly}
              onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        );
      })}
    </section>
  );
}
