import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AuthRequestError,
  type SaveMemberAccountInput,
  authRepository,
} from "../../../data/authRepository";
import type { Member } from "../../../types/schedule";
import { mergeMemberAccountFields, upsertMemberAccount } from "../model/masterSettings";

/** メンバーアカウントAPIの取得・保存・パスワード再設定を一つのI/O境界にまとめます。 */
export function useMemberAccountAdministration(members: Member[], active: boolean) {
  const [accountMembers, setAccountMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [temporaryPasswords, setTemporaryPasswords] = useState<Record<string, string>>({});

  const mergedMembers = useMemo(() => {
    const accountMemberById = new Map(accountMembers.map((member) => [member.id, member]));
    const scheduleMemberById = new Map(members.map((member) => [member.id, member]));
    return [
      ...accountMembers.map((member) =>
        mergeMemberAccountFields(scheduleMemberById.get(member.id) ?? member, member),
      ),
      ...members
        .filter((member) => !accountMemberById.has(member.id))
        .map((member) => mergeMemberAccountFields(member, undefined)),
    ];
  }, [accountMembers, members]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccountMembers(await authRepository.listMembersWithAccounts());
    } catch (loadError) {
      setError(formatAuthAdminError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      void load();
    }
  }, [active, load]);

  const reflectAccountResult = useCallback(
    (result: { member: Member; temporaryPassword?: string | null }) => {
      setAccountMembers((current) => upsertMemberAccount(current, result.member));
      if (result.temporaryPassword) {
        setTemporaryPasswords((current) => ({
          ...current,
          [result.member.id]: result.temporaryPassword ?? "",
        }));
      }
    },
    [],
  );

  const saveAccount = useCallback(
    async (memberId: string, input: SaveMemberAccountInput, rowKey: string) => {
      setSavingRowKey(rowKey);
      setError(null);
      try {
        reflectAccountResult(await authRepository.saveMemberAccount(memberId, input));
      } catch (saveError) {
        setError(formatAuthAdminError(saveError));
      } finally {
        setSavingRowKey(null);
      }
    },
    [reflectAccountResult],
  );

  const resetPassword = useCallback(
    async (memberId: string, password: string, rowKey: string) => {
      setSavingRowKey(rowKey);
      setError(null);
      try {
        reflectAccountResult(
          await authRepository.resetMemberPassword(memberId, {
            password: password || null,
            passwordResetRequired: true,
          }),
        );
      } catch (resetError) {
        setError(formatAuthAdminError(resetError));
      } finally {
        setSavingRowKey(null);
      }
    },
    [reflectAccountResult],
  );

  return {
    error,
    load,
    loading,
    members: mergedMembers,
    resetPassword,
    saveAccount,
    savingRowKey,
    temporaryPasswords,
  };
}

function formatAuthAdminError(error: unknown) {
  if (error instanceof AuthRequestError) {
    if (error.status === 403) {
      return "メンバー管理は管理者権限が必要です。";
    }
    if (error.status === 401) {
      return "ログイン状態を確認できませんでした。再ログインしてください。";
    }
    try {
      const parsed = JSON.parse(error.message) as { message?: string };
      return parsed.message || error.message;
    } catch {
      return error.message;
    }
  }
  return error instanceof Error ? error.message : "メンバー管理情報を取得できませんでした。";
}
