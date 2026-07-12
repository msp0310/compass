import { getMemberStatusLabel, isMemberActive } from "../../../lib/members";
import type { Member, MemberAvailabilityOverride, Team } from "../../../types/schedule";

export type MemberAccountFilter = "all" | "loginEnabled" | "missing" | "admin" | "inactive";

export type MemberAccountRowModel = {
  member: Member;
  memberTeams: Team[];
};

export const roleOptions = [
  { label: "管理者", value: "admin" },
  { label: "一般ユーザー", value: "user" },
] as const;

export function buildMemberAccountRows(members: Member[], teams: Team[]) {
  return members
    .map((member) => ({
      member,
      memberTeams: teams.filter((team) => team.memberIds.includes(member.id)),
    }))
    .toSorted((left, right) => {
      const activeDelta =
        Number(isMemberActive(right.member)) - Number(isMemberActive(left.member));
      return activeDelta || left.member.name.localeCompare(right.member.name, "ja");
    });
}

export function filterMemberAccountRows(
  rows: MemberAccountRowModel[],
  filter: MemberAccountFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  return rows.filter(({ member, memberTeams }) => {
    if (!matchesAccountFilter(filter, member)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return [
      member.name,
      member.initials,
      member.role,
      getMemberStatusLabel(member),
      ...memberTeams.map((team) => team.name),
      member.loginEmail ?? "",
      roleLabel(member.permissionRole ?? ""),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export function getMemberAccountSummary(members: Member[]) {
  const emailSet = members.filter(hasEmailAddress).length;
  return {
    active: members.filter(isMemberActive).length,
    admin: members.filter(
      (member) => hasLoginAccount(member) && normalizeRole(member.permissionRole ?? "") === "admin",
    ).length,
    emailSet,
    inactive: members.filter((member) => !isMemberActive(member)).length,
    missingEmail: members.length - emailSet,
    total: members.length,
  };
}

export function getMemberAccountFilterOptions(members: Member[]) {
  const summary = getMemberAccountSummary(members);
  return [
    { count: summary.total, label: "全員", value: "all" },
    { count: summary.emailSet, label: "メール設定済み", value: "loginEnabled" },
    { count: summary.missingEmail, label: "メール未設定", value: "missing" },
    { count: summary.admin, label: "管理者", value: "admin" },
    { count: summary.inactive, label: "休止中", value: "inactive" },
  ] satisfies { count: number; label: string; value: MemberAccountFilter }[];
}

export function hasLoginAccount(member: Member) {
  return Boolean(member.loginCreatedAt || member.passwordChangedAt || member.lastLoginAt);
}

export function hasEmailAddress(member: Member) {
  return Boolean(member.loginEmail?.trim());
}

export function roleLabel(role: string) {
  const normalizedRole = normalizeRole(role);
  return roleOptions.find((option) => option.value === normalizedRole)?.label ?? "メンバー";
}

export function normalizeRole(role: string) {
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized === "user" ? normalized : "user";
}

export function formatAvailabilityDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function upsertAvailabilityOverride(
  overrides: MemberAvailabilityOverride[],
  memberId: string,
  date: string,
  label: string,
) {
  return [
    ...overrides.filter((override) => override.date !== date),
    {
      date,
      id: `${memberId}-${date}`,
      label: label.trim() || "休暇",
      type: "unavailable" as const,
    },
  ].toSorted((left, right) => left.date.localeCompare(right.date));
}

function matchesAccountFilter(filter: MemberAccountFilter, member: Member) {
  switch (filter) {
    case "admin": {
      return hasLoginAccount(member) && normalizeRole(member.permissionRole ?? "") === "admin";
    }
    case "inactive": {
      return !isMemberActive(member);
    }
    case "loginEnabled": {
      return hasEmailAddress(member);
    }
    case "missing": {
      return !hasEmailAddress(member);
    }
    case "all": {
      return true;
    }
  }
}
