import { expect, test } from "@playwright/test";

import {
  loginFormSchema,
  passwordChangeFormSchema,
} from "../../frontend/src/features/auth/model/authFormSchemas";
import { taskCreateFormSchema } from "../../frontend/src/features/gantt/model/taskFormSchemas";
import { projectCreateFormSchema } from "../../frontend/src/features/projects/model/projectFormSchemas";

test("ログイン入力はメールアドレスを正規化し、不正な形式を拒否する", () => {
  expect(loginFormSchema.parse({ email: "  pm@example.com ", password: "secret" })).toEqual({
    email: "pm@example.com",
    password: "secret",
  });
  expect(loginFormSchema.safeParse({ email: "invalid", password: "secret" }).success).toBe(false);
});

test("パスワード変更は12文字以上と確認値の一致を要求する", () => {
  expect(
    passwordChangeFormSchema.safeParse({
      confirmation: "NewPassword12!",
      currentPassword: "current",
      newPassword: "DifferentPass12!",
    }).success,
  ).toBe(false);
  expect(
    passwordChangeFormSchema.safeParse({
      confirmation: "NewPassword12!",
      currentPassword: "current",
      newPassword: "NewPassword12!",
    }).success,
  ).toBe(true);
});

test("案件作成入力は名称をtrimして型安全なテンプレートIDを返す", () => {
  expect(
    projectCreateFormSchema.parse({
      projectName: "  管理名  ",
      projectNo: "  PJ-001  ",
      startDate: "2026-07-13",
      templateId: "standard-si",
      workspace: "  販売管理刷新  ",
    }),
  ).toEqual({
    projectName: "管理名",
    projectNo: "PJ-001",
    startDate: "2026-07-13",
    templateId: "standard-si",
    workspace: "販売管理刷新",
  });
});

test("タスク作成入力は担当者必須と開始・終了日の順序を検証する", () => {
  const base = {
    assigneeIds: ["yk"],
    effortHours: 8,
    end: "2026-07-14",
    parentId: "phase-1",
    start: "2026-07-13",
    title: "API設計",
  };
  expect(taskCreateFormSchema.safeParse(base).success).toBe(true);
  expect(taskCreateFormSchema.safeParse({ ...base, assigneeIds: [] }).success).toBe(false);
  expect(taskCreateFormSchema.safeParse({ ...base, end: "2026-07-12" }).success).toBe(false);
});
