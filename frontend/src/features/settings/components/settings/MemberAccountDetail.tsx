import { CheckIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type { Member } from "../../../../types/schedule";
import type { MemberAccountRowController } from "../../hooks/useMemberAccountRow";
import { formatAvailabilityDate } from "../../model/memberAccounts";
import { ColorSwatches } from "./ColorSwatches";
import { LoginPill, PasswordSummary, RolePill, RoleSelect } from "./MemberAccountBadges";

type MemberAccountDetailProps = {
  controller: MemberAccountRowController;
  member: Member;
  onSaveMember: (member: Member) => void;
  saving: boolean;
  temporaryPassword: string | null;
};

/** メンバー行の詳細フォームと非稼働日編集を表示します。 */
export function MemberAccountDetail({
  controller,
  member,
  onSaveMember,
  saving,
  temporaryPassword,
}: MemberAccountDetailProps) {
  return (
    <tr className="member-detail-row">
      <td colSpan={6}>
        <div className="member-detail-panel">
          <div className="member-detail-basic">
            <strong>基本情報</strong>
            <div className="member-detail-grid">
              <label>
                メールアドレス
                <input
                  aria-label={`${member.name} のメールアドレス`}
                  onChange={(event) => {
                    controller.setEmail(event.target.value);
                    onSaveMember({ ...member, loginEmail: event.target.value });
                  }}
                  placeholder="name@example.com"
                  type="email"
                  value={controller.email}
                />
              </label>
              <label>
                略称
                <input
                  aria-label={`${member.name} の略称`}
                  maxLength={3}
                  onChange={(event) =>
                    onSaveMember({
                      ...member,
                      initials:
                        event.target.value.trim().toUpperCase().slice(0, 3) || member.initials,
                    })
                  }
                  value={member.initials}
                />
              </label>
              <label>
                週キャパ
                <input
                  aria-label={`${member.name} の週キャパ`}
                  min="1"
                  onChange={(event) =>
                    onSaveMember({
                      ...member,
                      capacityHours: Math.max(Number(event.target.value) || 1, 1),
                    })
                  }
                  type="number"
                  value={member.capacityHours}
                />
              </label>
              <label>
                権限
                <RoleSelect onChange={controller.setRole} value={controller.role} />
              </label>
              <label className="member-detail-toggle">
                ログイン
                <span>
                  <input
                    checked={controller.enabled}
                    onChange={(event) => controller.setEnabled(event.target.checked)}
                    type="checkbox"
                  />
                  {controller.enabled ? "有効" : "無効"}
                </span>
              </label>
              <label>
                パスワード
                <input
                  aria-label={`${member.name} の新しいパスワード`}
                  onChange={(event) => controller.setPassword(event.target.value)}
                  placeholder={controller.accountExists ? "空なら仮PW発行" : "初期PW（空なら発行）"}
                  type="password"
                  value={controller.password}
                />
              </label>
            </div>
            <div className="member-detail-actions">
              <RolePill role={controller.role} />
              <LoginPill
                enabled={controller.enabled}
                member={{ ...member, loginEmail: controller.email }}
              />
              <PasswordSummary
                accountExists={controller.accountExists}
                temporaryPassword={temporaryPassword}
              />
              <button
                className="subtle-action primary-lite"
                disabled={saving || !controller.email.trim()}
                onClick={controller.saveAccount}
                type="button"
              >
                <CheckIcon />
                {controller.accountExists ? "ログインを保存" : "ログインを作成"}
              </button>
              <button className="subtle-action" onClick={controller.cancelEditing} type="button">
                <XMarkIcon />
                入力を戻す
              </button>
            </div>
            <div className="member-detail-color">
              <strong>表示色</strong>
              <ColorSwatches
                label={`${member.name} の表示色`}
                onChange={(color) => onSaveMember({ ...member, color })}
                value={member.color}
              />
            </div>
          </div>

          <div className="member-availability-editor inline">
            <div className="member-availability-heading">
              <strong>非稼働日</strong>
              <span>{controller.availabilityOverrides.length}日</span>
            </div>
            <div className="member-availability-create">
              <input
                aria-label={`${member.name} の非稼働日`}
                onChange={(event) => controller.setAvailabilityDate(event.target.value)}
                onInput={(event) => controller.setAvailabilityDate(event.currentTarget.value)}
                type="date"
                value={controller.availabilityDate}
              />
              <input
                aria-label={`${member.name} の非稼働理由`}
                onChange={(event) => controller.setAvailabilityLabel(event.target.value)}
                onInput={(event) => controller.setAvailabilityLabel(event.currentTarget.value)}
                placeholder="理由"
                value={controller.availabilityLabel}
              />
              <button
                className="subtle-action"
                disabled={!controller.availabilityDate}
                onClick={controller.addAvailabilityOverride}
                type="button"
              >
                <PlusIcon />
                追加
              </button>
            </div>
            {controller.availabilityOverrides.length > 0 ? (
              <div className="member-availability-list">
                {controller.availabilityOverrides.slice(0, 6).map((override) => (
                  <span className="member-availability-chip" key={override.id}>
                    {formatAvailabilityDate(override.date)}
                    <small>{override.label}</small>
                    <button
                      aria-label={`${member.name} ${override.date} の非稼働日を削除`}
                      onClick={() => controller.removeAvailabilityOverride(override.id)}
                      type="button"
                    >
                      <TrashIcon />
                    </button>
                  </span>
                ))}
                {controller.availabilityOverrides.length > 6 ? (
                  <span className="member-availability-more">
                    ほか{controller.availabilityOverrides.length - 6}日
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="member-availability-empty">登録なし</p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
