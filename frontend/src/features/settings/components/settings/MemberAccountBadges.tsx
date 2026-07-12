import type { Member } from "../../../../types/schedule";
import { hasEmailAddress, normalizeRole, roleLabel, roleOptions } from "../../model/memberAccounts";

export function AccountEmail({ email }: { email: string | null }) {
  return email ? (
    <div className="user-email-read">
      <strong>{email}</strong>
      <small>メールアドレス</small>
    </div>
  ) : (
    <div className="user-email-read empty">
      <strong>未設定</strong>
      <small>ログインなし</small>
    </div>
  );
}

export function RolePill({ role }: { role: string }) {
  const normalizedRole = normalizeRole(role);
  return <span className={`user-role-pill ${normalizedRole}`}>{roleLabel(normalizedRole)}</span>;
}

export function LoginPill({ enabled, member }: { enabled: boolean; member: Member }) {
  if (!hasEmailAddress(member)) {
    return <span className="user-login-pill missing">未設定</span>;
  }
  return (
    <span className={enabled ? "user-login-pill enabled" : "user-login-pill disabled"}>
      {enabled ? "有効" : "停止"}
    </span>
  );
}

export function PasswordSummary({
  accountExists,
  temporaryPassword,
}: {
  accountExists: boolean;
  temporaryPassword: string | null;
}) {
  return temporaryPassword ? (
    <span className="user-temp-password">仮PW: {temporaryPassword}</span>
  ) : (
    <span className="user-password-summary">{accountExists ? "仮PW発行可" : "設定時に発行"}</span>
  );
}

export function RoleSelect({
  onChange,
  value,
}: {
  onChange: (role: string) => void;
  value: string;
}) {
  return (
    <select
      aria-label="権限"
      onChange={(event) => onChange(event.target.value)}
      value={normalizeRole(value)}
    >
      {roleOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
