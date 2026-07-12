import { z } from "zod";

export const taskCreateFormSchema = z
  .object({
    assigneeIds: z.array(z.string()).min(1, "担当者を1名以上選択してください。"),
    effortHours: z
      .number()
      .min(0, "予定工数は0以上で入力してください。")
      .max(100_000, "予定工数が大きすぎます。"),
    end: z.iso.date("終了日を入力してください。"),
    parentId: z.string(),
    start: z.iso.date("開始日を入力してください。"),
    title: z
      .string()
      .trim()
      .min(1, "タスク名を入力してください。")
      .max(200, "タスク名は200文字以内で入力してください。"),
  })
  .refine((value) => value.start <= value.end, {
    message: "終了日は開始日以降にしてください。",
    path: ["end"],
  });

export type TaskCreateFormValue = z.infer<typeof taskCreateFormSchema>;
