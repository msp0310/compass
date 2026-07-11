import type { Member } from "../types/schedule";
import { ApiRequestError, requestJson } from "./apiClient";

export { ApiRequestError as AuthRequestError } from "./apiClient";

export type AuthUser = {
  email: string;
  id: string;
  memberId?: string | null;
  name: string;
  role: string;
  passwordResetRequired: boolean;
};

export type AuthSession = {
  expiresAt: string;
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

function getAuthenticatedHeaders() {
  return {};
}

export const authRepository = {
  clearSession() {
    // セッションはHttpOnly Cookieで管理するため、ブラウザー側に削除対象はありません。
  },

  getAccessToken() {
    return null;
  },

  async getCurrentUser() {
    try {
      return await requestJson<AuthUser>("/auth/me");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async login(email: string, password: string) {
    const session = await requestJson<AuthSession>("/auth/login", {
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
    return session;
  },

  async logout() {
    await requestJson<void>("/auth/logout", {
      method: "POST",
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return requestJson<void>("/auth/change-password", {
      body: JSON.stringify({ currentPassword, newPassword }),
      method: "POST",
    });
  },

  async listMembersWithAccounts() {
    return requestJson<Member[]>("/auth/members", {
      headers: getAuthenticatedHeaders(),
    });
  },

  async saveMemberAccount(memberId: string, input: SaveMemberAccountInput) {
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
    return requestJson<MemberAccountMutationResponse>(
      `/auth/members/${encodeURIComponent(memberId)}/reset-password`,
      {
        body: JSON.stringify(input),
        headers: getAuthenticatedHeaders(),
        method: "POST",
      },
    );
  },
};
