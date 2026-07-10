import type { Member } from "../types/schedule";
import { members as demoMembers } from "./mockSchedule";

export type AuthUser = {
  email: string;
  id: string;
  name: string;
  role: string;
};

export type AuthSession = {
  expiresAt: string;
  token: string;
  user: AuthUser;
};

export type SaveMemberAccountInput = {
  email: string;
  loginEnabled: boolean;
  password?: string | null;
  permissionRole: string;
};

export type MemberAccountMutationResponse = {
  member: Member;
  temporaryPassword: string | null;
};

export type ResetMemberPasswordInput = {
  password?: string | null;
  passwordResetRequired: boolean;
};

/** 認証APIの失敗をHTTPステータス付きで伝えるエラーです。 */
export class AuthRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthRequestError";
  }
}

const authSessionKey = "si-schedule-manager-auth-session-v1";
const demoMemberAccountsKey = "si-schedule-manager-demo-member-accounts-v1";
const apiBaseUrl = (import.meta.env.VITE_SCHEDULE_API_BASE_URL ?? "/api").replace(/\/$/, "");
const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_AUTH_FALLBACK === "true";
const demoEmail = "pm@example.com";
const demoPassword = "Password123!";
const demoSessionToken = "demo-local-session-token";
const demoUser: AuthUser = {
  email: demoEmail,
  id: "demo-pm",
  name: "山田 健太",
  role: "admin",
};

type DemoMemberAccount = {
  email: string | null;
  loginCreatedAt: string | null;
  loginEnabled: boolean;
  password: string;
  passwordChangedAt: string | null;
  passwordResetRequired: boolean;
  permissionRole: string;
};

type DemoMemberAccounts = Record<string, DemoMemberAccount>;

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(authSessionKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!isAuthSession(parsed)) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredSession(session: AuthSession) {
  window.localStorage.setItem(authSessionKey, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(authSessionKey);
}

function createDemoSession(): AuthSession {
  return {
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    token: demoSessionToken,
    user: demoUser,
  };
}

function isDemoSession(session: AuthSession | null) {
  return session?.token === demoSessionToken;
}

function normalizeInputEmail(email: string) {
  return email.trim().toLowerCase();
}

function readDemoMemberAccounts(): DemoMemberAccounts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(demoMemberAccountsKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DemoMemberAccounts;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDemoMemberAccounts(accounts: DemoMemberAccounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(demoMemberAccountsKey, JSON.stringify(accounts));
}

function createDemoMembersWithAccounts(): Member[] {
  const accounts = readDemoMemberAccounts();
  return demoMembers.map((member) => {
    const account =
      accounts[member.id] ??
      (member.id === "yk"
        ? {
            email: demoEmail,
            loginCreatedAt: new Date().toISOString(),
            loginEnabled: true,
            password: demoPassword,
            passwordChangedAt: new Date().toISOString(),
            passwordResetRequired: false,
            permissionRole: "admin",
          }
        : null);
    return {
      ...member,
      loginCreatedAt: account?.loginCreatedAt ?? null,
      loginEmail: account?.email ?? null,
      loginEnabled: account?.loginEnabled ?? false,
      passwordChangedAt: account?.passwordChangedAt ?? null,
      passwordResetRequired: account?.passwordResetRequired ?? false,
      permissionRole: account?.permissionRole ?? "member",
    };
  });
}

function findDemoLoginAccount(email: string, password: string) {
  const normalizedEmail = normalizeInputEmail(email);
  if (normalizedEmail === demoEmail && password === demoPassword) {
    return demoUser;
  }

  const accounts = readDemoMemberAccounts();
  const member = demoMembers.find((candidate) => {
    const account = accounts[candidate.id];
    return (
      account != null &&
      account.loginEnabled &&
      normalizeInputEmail(account.email ?? "") === normalizedEmail &&
      account.password === password
    );
  });
  if (!member) return null;
  const account = accounts[member.id];
  return {
    email: account.email ?? email,
    id: member.id,
    name: member.name,
    role: account.permissionRole,
  };
}

function canUseDemoFallback(error: unknown) {
  if (!demoFallbackEnabled) return false;
  if (error instanceof AuthRequestError) {
    return error.status >= 500;
  }
  return error instanceof TypeError;
}

function createTemporaryPassword() {
  return `Temp-${Math.floor(Math.random() * 900000 + 100000)}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AuthRequestError(
      body || `${response.status} ${response.statusText}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function getAuthenticatedHeaders() {
  const session = readStoredSession();
  if (!session) {
    throw new AuthRequestError("ログインが必要です。", 401);
  }
  return {
    Authorization: `Bearer ${session.token}`,
  };
}

function isAuthSession(value: Partial<AuthSession>): value is AuthSession {
  return (
    typeof value.token === "string" && typeof value.expiresAt === "string" && isAuthUser(value.user)
  );
}

function isAuthUser(value: unknown): value is AuthUser {
  if (value == null || typeof value !== "object") return false;
  const maybe = value as Partial<AuthUser>;
  return (
    typeof maybe.id === "string" &&
    typeof maybe.email === "string" &&
    typeof maybe.name === "string" &&
    typeof maybe.role === "string"
  );
}

export const authRepository = {
  clearSession() {
    clearStoredSession();
  },

  getAccessToken() {
    return readStoredSession()?.token ?? null;
  },

  async getCurrentUser() {
    const session = readStoredSession();
    if (!session) return null;
    if (isDemoSession(session)) {
      if (demoFallbackEnabled) return session.user;
      clearStoredSession();
      return null;
    }

    try {
      const user = await requestJson<AuthUser>("/auth/me", {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      saveStoredSession({ ...session, user });
      return user;
    } catch (error) {
      if (error instanceof AuthRequestError && error.status === 401) {
        clearStoredSession();
        return null;
      }
      throw error;
    }
  },

  async login(email: string, password: string) {
    try {
      const session = await requestJson<AuthSession>("/auth/login", {
        body: JSON.stringify({ email, password }),
        method: "POST",
      });
      saveStoredSession(session);
      return session;
    } catch (error) {
      const demoLoginUser = findDemoLoginAccount(email, password);
      if (!demoLoginUser || !canUseDemoFallback(error)) {
        throw error;
      }
      const session = {
        ...createDemoSession(),
        user: demoLoginUser,
      };
      saveStoredSession(session);
      return session;
    }
  },

  async logout() {
    const session = readStoredSession();
    clearStoredSession();
    if (!session || isDemoSession(session)) return;

    await requestJson<void>("/auth/logout", {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      method: "POST",
    });
  },

  async listMembersWithAccounts() {
    try {
      return await requestJson<Member[]>("/auth/members", {
        headers: getAuthenticatedHeaders(),
      });
    } catch (error) {
      if (!demoFallbackEnabled || !isDemoSession(readStoredSession()) || !canUseDemoFallback(error)) {
        throw error;
      }
      return createDemoMembersWithAccounts();
    }
  },

  async saveMemberAccount(memberId: string, input: SaveMemberAccountInput) {
    if (demoFallbackEnabled && isDemoSession(readStoredSession())) {
      const member = demoMembers.find((candidate) => candidate.id === memberId);
      if (!member) {
        throw new AuthRequestError("メンバーが見つかりません。", 404);
      }
      const accounts = readDemoMemberAccounts();
      const email = input.email.trim();
      const normalizedEmail = normalizeInputEmail(email);
      const duplicated = Object.entries(accounts).some(
        ([candidateMemberId, account]) =>
          candidateMemberId !== memberId && normalizeInputEmail(account.email ?? "") === normalizedEmail,
      );
      if (!email) {
        throw new AuthRequestError("メールアドレスを入力してください。", 409);
      }
      if (duplicated || (memberId !== "yk" && normalizedEmail === demoEmail)) {
        throw new AuthRequestError("このメールアドレスは既に使われています。", 409);
      }
      const previous = accounts[memberId];
      const password = input.password?.trim() || previous?.password || createTemporaryPassword();
      const now = new Date().toISOString();
      accounts[memberId] = {
        email,
        loginCreatedAt: previous?.loginCreatedAt ?? now,
        loginEnabled: input.loginEnabled,
        password,
        passwordChangedAt: input.password?.trim() ? now : (previous?.passwordChangedAt ?? now),
        passwordResetRequired: Boolean(input.password?.trim()),
        permissionRole: input.permissionRole.trim().toLowerCase() || "member",
      };
      saveDemoMemberAccounts(accounts);
      return {
        member: createDemoMembersWithAccounts().find((candidate) => candidate.id === memberId)!,
        temporaryPassword: previous ? null : password,
      };
    }

    return requestJson<MemberAccountMutationResponse>(
      `/auth/members/${encodeURIComponent(memberId)}/account`,
      {
        body: JSON.stringify(input),
        headers: getAuthenticatedHeaders(),
        method: "PUT",
      },
    );
  },

  async resetMemberPassword(memberId: string, input: ResetMemberPasswordInput) {
    if (demoFallbackEnabled && isDemoSession(readStoredSession())) {
      const member = demoMembers.find((candidate) => candidate.id === memberId);
      if (!member) {
        throw new AuthRequestError("メンバーが見つかりません。", 404);
      }
      const accounts = readDemoMemberAccounts();
      const previous = accounts[memberId];
      if (!previous) {
        throw new AuthRequestError("ログインが作成されていません。", 404);
      }
      const password = input.password?.trim() || createTemporaryPassword();
      accounts[memberId] = {
        ...previous,
        password,
        passwordChangedAt: new Date().toISOString(),
        passwordResetRequired: input.passwordResetRequired,
      };
      saveDemoMemberAccounts(accounts);
      return {
        member: createDemoMembersWithAccounts().find((candidate) => candidate.id === memberId)!,
        temporaryPassword: password,
      };
    }

    return requestJson<MemberAccountMutationResponse>(
      `/auth/members/${encodeURIComponent(memberId)}/reset-password`,
      {
        body: JSON.stringify(input),
        headers: getAuthenticatedHeaders(),
        method: "POST",
      },
    );
  },

  isUsingDemoSession() {
    return isDemoSession(readStoredSession());
  },
};
