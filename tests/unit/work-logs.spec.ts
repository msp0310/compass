import { expect, test } from "@playwright/test";

import {
  filterWorkLogs,
  getWorkLogSummary,
  normalizeWorkLogDraft,
} from "../../frontend/src/features/worklogs/model/workLogs";
import type {
  Member,
  ProjectIssue,
  ProjectWorkLog,
  ScheduleTask,
} from "../../frontend/src/types/schedule";

function workLog(patch: Partial<ProjectWorkLog> = {}): ProjectWorkLog {
  return {
    billable: true,
    category: "maintenance",
    createdAt: "2026-07-01T00:00:00.000Z",
    createdBy: "山田 健太",
    date: "2026-07-01",
    hours: 1.5,
    id: "log-1",
    memberId: "member-1",
    summary: "監視ログを確認",
    updatedAt: "2026-07-01T01:00:00.000Z",
    ...patch,
  };
}

test("作業ログ検索は担当者・タスク・課題・Markdownメモを対象にする", () => {
  const members = new Map([
    [
      "member-1",
      {
        capacityHours: 40,
        color: "#2563eb",
        id: "member-1",
        initials: "YK",
        name: "山田 健太",
        role: "PM",
      } satisfies Member,
    ],
  ]);
  const tasks = new Map([["task-1", { id: "task-1", title: "API調査" } as ScheduleTask]]);
  const issues = new Map([["issue-1", { id: "issue-1", title: "連携障害" } as ProjectIssue]]);
  const source = [workLog({ issueId: "issue-1", note: "再起動手順", taskId: "task-1" })];
  const filters = { category: "all" as const, memberId: "all", month: "all" };

  for (const query of ["山田", "API調査", "連携障害", "再起動"]) {
    expect(filterWorkLogs(source, { ...filters, query }, members, tasks, issues)).toHaveLength(1);
  }
});

test("作業ログ集計は保守系工数と担当者数を算出する", () => {
  expect(
    getWorkLogSummary([
      workLog(),
      workLog({ category: "meeting", hours: 2, id: "log-2", memberId: "member-2" }),
    ]),
  ).toEqual({ activeMembers: 2, operationHours: 1.5, totalHours: 3.5 });
});

test("作業ログdraftは負数工数と空の関連IDを正規化する", () => {
  expect(
    normalizeWorkLogDraft(
      workLog({ hours: -2, issueId: "", note: "  対応済み  ", summary: "  ", taskId: "" }),
    ),
  ).toMatchObject({
    hours: 0,
    issueId: undefined,
    note: "対応済み",
    summary: "運用保守対応",
    taskId: undefined,
  });
});
