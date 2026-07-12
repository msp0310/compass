import { expect, test } from "@playwright/test";

import { buildResourceAdjustmentSuggestions } from "../../frontend/src/features/resource/model/resourceAdjustments";
import {
  addDateMonths,
  aggregateTeamCapacityCell,
  buildMonthGroups,
  buildMonthWeekLabels,
  getAssignmentPosition,
  matchesCapacityFilter,
} from "../../frontend/src/features/resource/model/workloadPlanning";
import type {
  ProjectAssignment,
  ResourceCell,
  ResourceRowModel,
  TimelineColumn,
} from "../../frontend/src/types/schedule";

const weeks: TimelineColumn[] = [
  { key: "2026-06-29", label: "", span: 7, start: "2026-06-29", startIndex: 0 },
  { key: "2026-07-06", label: "", span: 7, start: "2026-07-06", startIndex: 7 },
  { key: "2026-07-13", label: "", span: 7, start: "2026-07-13", startIndex: 14 },
];

test("月グループと月内週番号を表示順に構築する", () => {
  expect(buildMonthGroups(weeks)).toEqual([
    { key: "2026-06", label: "2026/6", span: 1, startIndex: 0 },
    { key: "2026-07", label: "2026/7", span: 2, startIndex: 1 },
  ]);
  expect(buildMonthWeekLabels(weeks)).toEqual(["W1", "W1", "W2"]);
});

test("アサイン表示位置は表示期間内へ切り詰める", () => {
  const assignment = {
    endDate: "2026-07-15",
    startDate: "2026-06-20",
  } as ProjectAssignment;
  const position = getAssignmentPosition(assignment, "2026-07-01", "2026-07-31");

  expect(position.left).toBe(0);
  expect(position.width).toBe((15 / 31) * 100);
});

test("チーム負荷はメンバーの工数と能力を合算する", () => {
  const rows = [
    { cells: [{ capacityHours: 40, contributions: [], hours: 40, unavailableDays: 0 }] },
    { cells: [{ capacityHours: 40, contributions: [], hours: 20, unavailableDays: 1 }] },
  ] as unknown as ResourceRowModel[];

  expect(aggregateTeamCapacityCell(rows, 0, "2026-07-06")).toEqual({
    capacityHours: 80,
    contributions: [],
    hours: 60,
    percent: 75,
    tone: "good",
    unavailableDays: 1,
    week: "2026-07-06",
  });
});

test("負荷フィルターと年移動は境界値を保つ", () => {
  expect(matchesCapacityFilter([100, 40], "overloaded")).toBe(true);
  expect(matchesCapacityFilter([69, 0], "available")).toBe(true);
  expect(matchesCapacityFilter([70, 0], "available")).toBe(false);
  expect(addDateMonths("2026-07-01", 12)).toBe("2027-07-01");
});

test("負荷調整候補は軽減工数が大きい順に並べる", () => {
  const cell = {
    capacityHours: 40,
    hours: 50,
    contributions: [
      { assigneeCount: 2, hours: 8, start: "2026-07-01", taskId: "small" },
      { assigneeCount: 2, hours: 16, start: "2026-07-02", taskId: "large" },
    ],
  } as ResourceCell;

  const suggestions = buildResourceAdjustmentSuggestions(cell, "member-a", []);

  expect(suggestions.map((item) => item.contribution.taskId)).toEqual(["large", "small"]);
  expect(suggestions[0]?.nextPercent).toBe(85);
});
