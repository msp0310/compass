import {
  ArrowPathIcon,
  KeyIcon,
  PencilSquareIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";

import type { SaveMemberAccountInput } from "../../../../data/authRepository";
import { getMemberStatusLabel, isMemberActive } from "../../../../lib/members";
import type { Member, Team } from "../../../../types/schedule";
import { useMemberAccountRow } from "../../hooks/useMemberAccountRow";
import { AccountEmail } from "./MemberAccountBadges";
import { MemberAccountDetail } from "./MemberAccountDetail";

type MemberAccountRowProps = {
  assignmentCount: number;
  confirmingLifecycle: boolean;
  member: Member;
  memberTeams: Team[];
  onLifecycleConfirm: (memberId: string | null) => void;
  onResetPassword: (memberId: string, password: string, rowKey: string) => Promise<void>;
  onSaveAccount: (memberId: string, input: SaveMemberAccountInput, rowKey: string) => Promise<void>;
  onSaveMember: (member: Member) => void;
  onUpdateMemberLifecycle: (memberId: string, status: "active" | "inactive") => void;
  saving: boolean;
  temporaryPassword: string | null;
};

/** 一覧の1行と、必要時だけ開く詳細編集行を構成します。 */
export function MemberAccountRow({
  assignmentCount,
  confirmingLifecycle,
  member,
  memberTeams,
  onLifecycleConfirm,
  onResetPassword,
  onSaveAccount,
  onSaveMember,
  onUpdateMemberLifecycle,
  saving,
  temporaryPassword,
}: MemberAccountRowProps) {
  const controller = useMemberAccountRow({ member, onResetPassword, onSaveAccount, onSaveMember });
  const active = isMemberActive(member);

  function updateLifecycle(status: "active" | "inactive") {
    onUpdateMemberLifecycle(member.id, status);
    onLifecycleConfirm(null);
  }

  return (
    <>
      <tr className={controller.rowClassName}>
        <td>
          <div className="user-member-cell member-master-cell">
            <span style={{ "--avatar-color": member.color } as CSSProperties}>
              {member.initials}
            </span>
            <div>
              <input
                aria-label={`${member.name} の氏名`}
                className="member-inline-name"
                onChange={(event) => onSaveMember({ ...member, name: event.target.value })}
                value={member.name}
              />
              <small>{getMemberStatusLabel(member)}</small>
            </div>
          </div>
        </td>
        <td>
          <AccountEmail email={member.loginEmail ?? null} />
        </td>
        <td>
          <div className="user-team-list">
            {memberTeams.length > 0 ? memberTeams.map((team) => team.name).join(" / ") : "未所属"}
          </div>
        </td>
        <td>
          <input
            aria-label={`${member.name} のロール`}
            className="member-compact-input"
            onChange={(event) => onSaveMember({ ...member, role: event.target.value })}
            value={member.role}
          />
        </td>
        <td>
          <div className="member-status-stack">
            <span className={active ? "member-status active" : "member-status inactive"}>
              {getMemberStatusLabel(member)}
            </span>
            <small>{assignmentCount}件担当</small>
          </div>
        </td>
        <td>
          <div className="user-action-cell member-action-cell">
            <button
              className={controller.detailOpen ? "subtle-action active" : "subtle-action"}
              onClick={() => controller.setDetailOpen((current) => !current)}
              type="button"
            >
              <PencilSquareIcon />
              詳細
            </button>
            {controller.accountExists ? (
              <button
                className="subtle-action"
                disabled={saving}
                onClick={controller.resetPassword}
                type="button"
              >
                <KeyIcon />
                仮PW
              </button>
            ) : null}
            {active ? (
              confirmingLifecycle ? (
                <div className="member-lifecycle-confirm compact">
                  <span>既存担当は残ります</span>
                  <div>
                    <button
                      className="subtle-action"
                      onClick={() => onLifecycleConfirm(null)}
                      type="button"
                    >
                      戻る
                    </button>
                    <button
                      className="subtle-action danger"
                      onClick={() => updateLifecycle("inactive")}
                      type="button"
                    >
                      休止
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="subtle-action"
                  onClick={() => onLifecycleConfirm(member.id)}
                  type="button"
                >
                  <UserMinusIcon />
                  休止
                </button>
              )
            ) : (
              <button
                className="subtle-action"
                onClick={() => updateLifecycle("active")}
                type="button"
              >
                <ArrowPathIcon />
                復帰
              </button>
            )}
          </div>
        </td>
      </tr>
      {controller.detailOpen ? (
        <MemberAccountDetail
          controller={controller}
          member={member}
          onSaveMember={onSaveMember}
          saving={saving}
          temporaryPassword={temporaryPassword}
        />
      ) : null}
    </>
  );
}
