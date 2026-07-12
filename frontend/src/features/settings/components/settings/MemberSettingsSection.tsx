import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import type { Member, Team } from "../../../../types/schedule";
import { useMemberAccountAdministration } from "../../hooks/useMemberAccountAdministration";
import { ColorSwatches, getNextMemberColor } from "./ColorSwatches";
import { MemberAccountTable } from "./MemberAccountTable";

type MemberSettingsSectionProps = {
  active: boolean;
  defaultTeamId: string;
  memberAssignmentCounts: Record<string, number>;
  members: Member[];
  onCreateMember: (member: Member, teamId: string | null) => void;
  onSaveMember: (member: Member) => void;
  onUpdateMemberLifecycle: (memberId: string, status: "active" | "inactive") => void;
  teams: Team[];
};

/** メンバー作成と既存メンバーのアカウント管理を構成します。 */
export function MemberSettingsSection({
  active,
  defaultTeamId,
  memberAssignmentCounts,
  members,
  onCreateMember,
  onSaveMember,
  onUpdateMemberLifecycle,
  teams,
}: MemberSettingsSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SE");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState(getNextMemberColor(members.length));
  const [teamId, setTeamId] = useState<string | null>(defaultTeamId);
  const [lifecycleConfirmMemberId, setLifecycleConfirmMemberId] = useState<string | null>(null);
  const accounts = useMemberAccountAdministration(members, active);

  useEffect(() => setTeamId(defaultTeamId), [defaultTeamId]);

  function createMember() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      return;
    }
    onCreateMember(
      {
        capacityHours: 40,
        color,
        id: `member-${Date.now().toString(36)}`,
        initials:
          initials.trim().toUpperCase().slice(0, 3) || trimmedName.slice(0, 2).toUpperCase(),
        loginEmail: trimmedEmail,
        loginEnabled: false,
        name: trimmedName,
        permissionRole: "user",
        role: role.trim() || "SE",
        status: "active",
      },
      teamId,
    );
    setName("");
    setEmail("");
    setInitials("");
    setRole("SE");
    setColor(getNextMemberColor(members.length + 1));
  }

  return (
    <div hidden={!active}>
      <section className="settings-card member-create-card">
        <div className="settings-card-heading">
          <strong>メンバー追加</strong>
          <span>未所属のまま追加できます</span>
        </div>
        <div className="member-create-grid master-member-create-grid">
          <input
            aria-label="新規メンバー名"
            onChange={(event) => setName(event.target.value)}
            placeholder="氏名"
            value={name}
          />
          <input
            aria-label="新規メンバーメールアドレス"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="メールアドレス（必須）"
            type="email"
            value={email}
          />
          <input
            aria-label="新規メンバー略称"
            onChange={(event) => setInitials(event.target.value)}
            placeholder="略称"
            value={initials}
          />
          <input
            aria-label="新規メンバーロール"
            onChange={(event) => setRole(event.target.value)}
            placeholder="ロール"
            value={role}
          />
          <select
            aria-label="新規メンバー所属"
            onChange={(event) => setTeamId(event.target.value || null)}
            value={teamId ?? ""}
          >
            <option value="">未所属</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            className="primary-button"
            disabled={!name.trim() || !email.trim()}
            onClick={createMember}
            type="button"
          >
            <PlusIcon />
            追加
          </button>
        </div>
        <ColorSwatches label="新規メンバー色" onChange={setColor} value={color} />
      </section>

      <MemberAccountTable
        error={accounts.error}
        lifecycleConfirmMemberId={lifecycleConfirmMemberId}
        loading={accounts.loading}
        memberAssignmentCounts={memberAssignmentCounts}
        members={accounts.members}
        onLifecycleConfirm={setLifecycleConfirmMemberId}
        onRefresh={accounts.load}
        onResetPassword={accounts.resetPassword}
        onSaveAccount={accounts.saveAccount}
        onSaveMember={onSaveMember}
        onUpdateMemberLifecycle={onUpdateMemberLifecycle}
        savingRowKey={accounts.savingRowKey}
        teams={teams}
        temporaryPasswords={accounts.temporaryPasswords}
      />
    </div>
  );
}
