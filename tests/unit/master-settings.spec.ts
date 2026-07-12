import { expect, test } from "@playwright/test";

import {
  getActiveTeamMemberCount,
  updateTeamMembershipRole,
} from "../../frontend/src/features/settings/model/masterSettings";
import {
  buildMemberAccountRows,
  filterMemberAccountRows,
  getMemberAccountSummary,
  upsertAvailabilityOverride,
} from "../../frontend/src/features/settings/model/memberAccounts";
import type { Member, Team } from "../../frontend/src/types/schedule";

function member(id: string, name: string, patch: Partial<Member> = {}): Member {
  return {
    capacityHours: 40,
    color: "#2563eb",
    id,
    initials: name.slice(0, 2),
    name,
    role: "SE",
    status: "active",
    ...patch,
  };
}

const team: Team = {
  code: "業",
  description: "業務システム開発",
  id: "team-1",
  memberIds: ["member-1", "member-2"],
  name: "業務システム事業部",
};

test("メンバー一覧は状態順に並べ、担当者と所属チームを検索できる", () => {
  const members = [
    member("member-2", "佐藤 翔", { status: "inactive" }),
    member("member-1", "山田 健太", { loginEmail: "pm@example.com" }),
  ];
  const rows = buildMemberAccountRows(members, [team]);

  expect(rows.map((row) => row.member.id)).toEqual(["member-1", "member-2"]);
  expect(filterMemberAccountRows(rows, "all", "業務システム")).toHaveLength(2);
  expect(filterMemberAccountRows(rows, "all", "pm@example.com")).toHaveLength(1);
  expect(filterMemberAccountRows(rows, "inactive", "")).toHaveLength(1);
});

test("アカウント集計はメール設定と管理者権限を別々に数える", () => {
  const summary = getMemberAccountSummary([
    member("member-1", "山田 健太", {
      loginCreatedAt: "2026-07-01T00:00:00.000Z",
      loginEmail: "pm@example.com",
      permissionRole: "admin",
    }),
    member("member-2", "佐藤 翔", { status: "inactive" }),
  ]);

  expect(summary).toEqual({
    active: 1,
    admin: 1,
    emailSet: 1,
    inactive: 1,
    missingEmail: 1,
    total: 2,
  });
});

test("チーム権限更新は他メンバーの所属権限を維持する", () => {
  const updated = updateTeamMembershipRole(team, "member-1", "manager");

  expect(updated.memberships).toEqual([
    { memberId: "member-2", role: "member" },
    { memberId: "member-1", role: "manager" },
  ]);
  expect(
    getActiveTeamMemberCount(team, [
      member("member-1", "山田 健太"),
      member("member-2", "佐藤 翔", { status: "inactive" }),
    ]),
  ).toBe(1);
});

test("同じ日付の非稼働日は理由を置き換える", () => {
  const result = upsertAvailabilityOverride(
    [{ date: "2026-07-20", id: "old", label: "休暇", type: "unavailable" }],
    "member-1",
    "2026-07-20",
    "研修",
  );

  expect(result).toEqual([
    {
      date: "2026-07-20",
      id: "member-1-2026-07-20",
      label: "研修",
      type: "unavailable",
    },
  ]);
});
