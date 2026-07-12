import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import type { SaveMemberAccountInput } from "../../../../data/authRepository";
import type { Member, Team } from "../../../../types/schedule";
import {
  buildMemberAccountRows,
  filterMemberAccountRows,
  getMemberAccountFilterOptions,
  getMemberAccountSummary,
  type MemberAccountFilter,
} from "../../model/memberAccounts";
import { MemberAccountRow } from "./MemberAccountRow";

type MemberAccountTableProps = {
  error: string | null;
  lifecycleConfirmMemberId: string | null;
  loading: boolean;
  memberAssignmentCounts: Record<string, number>;
  members: Member[];
  onLifecycleConfirm: (memberId: string | null) => void;
  onRefresh: () => void;
  onResetPassword: (memberId: string, password: string, rowKey: string) => Promise<void>;
  onSaveAccount: (memberId: string, input: SaveMemberAccountInput, rowKey: string) => Promise<void>;
  onSaveMember: (member: Member) => void;
  onUpdateMemberLifecycle: (memberId: string, status: "active" | "inactive") => void;
  savingRowKey: string | null;
  teams: Team[];
  temporaryPasswords: Record<string, string>;
};

/** メンバー一覧の検索、集計、行コンポーネントの構成だけを担います。 */
export function MemberAccountTable({
  error,
  lifecycleConfirmMemberId,
  loading,
  memberAssignmentCounts,
  members,
  onLifecycleConfirm,
  onRefresh,
  onResetPassword,
  onSaveAccount,
  onSaveMember,
  onUpdateMemberLifecycle,
  savingRowKey,
  teams,
  temporaryPasswords,
}: MemberAccountTableProps) {
  const [filter, setFilter] = useState<MemberAccountFilter>("all");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => buildMemberAccountRows(members, teams), [members, teams]);
  const filteredRows = useMemo(
    () => filterMemberAccountRows(rows, filter, query),
    [filter, query, rows],
  );
  const summary = useMemo(() => getMemberAccountSummary(members), [members]);
  const filterOptions = useMemo(() => getMemberAccountFilterOptions(members), [members]);

  return (
    <section
      className="user-account-section member-roster-account-section"
      aria-label="メンバー一覧・ログイン"
    >
      <div className="settings-card-heading user-account-heading">
        <div>
          <strong>メンバー一覧・ログイン</strong>
          <span>一覧は見渡しやすく、権限・パスワード・非稼働日は詳細で管理</span>
        </div>
        <button className="subtle-action" disabled={loading} onClick={onRefresh} type="button">
          <ArrowPathIcon />
          再読込
        </button>
      </div>

      <div className="user-account-summary member-account-summary">
        <div>
          <span>メンバー</span>
          <strong>{summary.total}名</strong>
        </div>
        <div>
          <span>有効メンバー</span>
          <strong>{summary.active}名</strong>
        </div>
        <div>
          <span>メール設定済み</span>
          <strong>{summary.emailSet}名</strong>
        </div>
        <div>
          <span>メール未設定</span>
          <strong>{summary.missingEmail}名</strong>
        </div>
        <div>
          <span>管理者</span>
          <strong>{summary.admin}名</strong>
        </div>
      </div>

      <div className="user-account-toolbar">
        <label>
          <MagnifyingGlassIcon />
          <input
            aria-label="メンバー検索"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="氏名・メール・チームで検索"
            value={query}
          />
        </label>
        <div className="user-account-filter-tabs" aria-label="メンバー絞り込み">
          {filterOptions.map((option) => (
            <button
              className={filter === option.value ? "active" : ""}
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
              <span>{option.count}</span>
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="user-account-error">{error}</p> : null}
      <div className="user-account-table-wrap member-account-table-wrap">
        <table className="user-account-table member-account-table">
          <thead>
            <tr>
              <th>メンバー</th>
              <th>メールアドレス</th>
              <th>所属</th>
              <th>ロール</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ member, memberTeams }) => (
              <MemberAccountRow
                assignmentCount={memberAssignmentCounts[member.id] ?? 0}
                confirmingLifecycle={lifecycleConfirmMemberId === member.id}
                key={member.id}
                member={member}
                memberTeams={memberTeams}
                onLifecycleConfirm={onLifecycleConfirm}
                onResetPassword={onResetPassword}
                onSaveAccount={onSaveAccount}
                onSaveMember={onSaveMember}
                onUpdateMemberLifecycle={onUpdateMemberLifecycle}
                saving={savingRowKey === member.id}
                temporaryPassword={temporaryPasswords[member.id] ?? null}
              />
            ))}
          </tbody>
        </table>
      </div>
      {filteredRows.length === 0 ? (
        <p className="user-account-empty">該当するメンバーはありません。</p>
      ) : null}
    </section>
  );
}
