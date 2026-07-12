import { z } from "zod";

export const projectCreateFormSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, "管理名を入力してください。")
    .max(120, "管理名は120文字以内で入力してください。"),
  projectNo: z.string().trim().max(64, "プロジェクトNo.は64文字以内で入力してください。"),
  startDate: z.iso.date("開始日を入力してください。"),
  templateId: z.enum(["empty", "maintenance", "standard-si"]),
  workspace: z
    .string()
    .trim()
    .min(1, "プロジェクト名を入力してください。")
    .max(120, "プロジェクト名は120文字以内で入力してください。"),
});

export type ProjectCreateFormValue = z.infer<typeof projectCreateFormSchema>;
