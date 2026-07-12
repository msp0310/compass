import { z } from "zod";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください。")
    .email("メールアドレスの形式を確認してください。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

export const passwordChangeFormSchema = z
  .object({
    confirmation: z.string().min(12, "確認用パスワードは12文字以上で入力してください。"),
    currentPassword: z.string().min(1, "現在のパスワードを入力してください。"),
    newPassword: z.string().min(12, "新しいパスワードは12文字以上で入力してください。"),
  })
  .refine((value) => value.newPassword === value.confirmation, {
    message: "確認用パスワードが一致しません。",
    path: ["confirmation"],
  });

export type LoginFormValue = z.infer<typeof loginFormSchema>;
export type PasswordChangeFormValue = z.infer<typeof passwordChangeFormSchema>;
