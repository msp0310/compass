import { useEffect, useMemo, useState } from "react";

import type { SaveMemberAccountInput } from "../../../data/authRepository";
import { isMemberActive } from "../../../lib/members";
import type { Member } from "../../../types/schedule";
import {
  hasLoginAccount,
  normalizeRole,
  upsertAvailabilityOverride,
} from "../model/memberAccounts";

type UseMemberAccountRowOptions = {
  member: Member;
  onResetPassword: (memberId: string, password: string, rowKey: string) => Promise<void>;
  onSaveAccount: (memberId: string, input: SaveMemberAccountInput, rowKey: string) => Promise<void>;
  onSaveMember: (member: Member) => void;
};

/** 一人分のアカウントdraftと非稼働日編集を行コンポーネントから分離します。 */
export function useMemberAccountRow({
  member,
  onResetPassword,
  onSaveAccount,
  onSaveMember,
}: UseMemberAccountRowOptions) {
  const accountExists = hasLoginAccount(member);
  const [email, setEmail] = useState(member.loginEmail ?? "");
  const [enabled, setEnabled] = useState(accountExists ? member.loginEnabled === true : true);
  const [role, setRole] = useState(normalizeRole(member.permissionRole ?? member.role));
  const [password, setPassword] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availabilityLabel, setAvailabilityLabel] = useState("休暇");
  const availabilityOverrides = useMemo(
    () =>
      [...(member.availabilityOverrides ?? [])].toSorted((left, right) =>
        left.date.localeCompare(right.date),
      ),
    [member.availabilityOverrides],
  );

  useEffect(() => {
    const nextAccountExists = hasLoginAccount(member);
    setEmail(member.loginEmail ?? "");
    setEnabled(nextAccountExists ? member.loginEnabled === true : true);
    setRole(normalizeRole(member.permissionRole ?? member.role));
    setPassword("");
  }, [member]);

  const dirty =
    accountExists &&
    (email.trim() !== member.loginEmail ||
      enabled !== (member.loginEnabled === true) ||
      role !== normalizeRole(member.permissionRole ?? ""));
  const rowClassName = [
    isMemberActive(member) ? "" : "member-inactive",
    accountExists && member.loginEnabled === false ? "login-disabled" : "",
    dirty ? "is-dirty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function cancelEditing() {
    setEmail(member.loginEmail ?? "");
    setEnabled(accountExists ? member.loginEnabled === true : true);
    setRole(normalizeRole(member.permissionRole ?? member.role));
    setPassword("");
  }

  function saveAccount() {
    void onSaveAccount(
      member.id,
      {
        email: email.trim(),
        loginEnabled: enabled,
        password: password.trim() || null,
        permissionRole: role,
      },
      member.id,
    );
  }

  function resetPassword() {
    if (!accountExists) {
      return;
    }
    void onResetPassword(member.id, password.trim(), member.id);
    setPassword("");
  }

  function addAvailabilityOverride() {
    if (!availabilityDate) {
      return;
    }
    onSaveMember({
      ...member,
      availabilityOverrides: upsertAvailabilityOverride(
        availabilityOverrides,
        member.id,
        availabilityDate,
        availabilityLabel,
      ),
    });
    setAvailabilityDate("");
    setAvailabilityLabel("休暇");
  }

  function removeAvailabilityOverride(overrideId: string) {
    onSaveMember({
      ...member,
      availabilityOverrides: availabilityOverrides.filter((override) => override.id !== overrideId),
    });
  }

  return {
    accountExists,
    addAvailabilityOverride,
    availabilityDate,
    availabilityLabel,
    availabilityOverrides,
    cancelEditing,
    detailOpen,
    email,
    enabled,
    password,
    removeAvailabilityOverride,
    resetPassword,
    role,
    rowClassName,
    saveAccount,
    setAvailabilityDate,
    setAvailabilityLabel,
    setDetailOpen,
    setEmail,
    setEnabled,
    setPassword,
    setRole,
  };
}

export type MemberAccountRowController = ReturnType<typeof useMemberAccountRow>;
