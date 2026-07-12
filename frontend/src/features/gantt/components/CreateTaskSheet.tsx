import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo } from "react";

import { FormFieldError } from "../../../components/forms/FormFieldError";
import { MemberChecklist } from "../../../components/ui/MemberChecklist";
import { getActiveMembers } from "../../../lib/members";
import type { CreateTaskInput, Member, ScheduleTask } from "../../../types/schedule";
import { type TaskCreateFormValue, taskCreateFormSchema } from "../model/taskFormSchemas";

type CreateTaskSheetProps = {
  members: Member[];
  onClose: () => void;
  onCreateTask: (input: CreateTaskInput) => void;
  tasks: ScheduleTask[];
};

function toggleAssignee(current: string[], memberId: string) {
  if (current.includes(memberId)) {
    return current.length > 1 ? current.filter((selectedId) => selectedId !== memberId) : current;
  }
  return [...current, memberId];
}

/** ガントに追加するタスクの基本情報を入力するシートです。 */
export function CreateTaskSheet({ members, onClose, onCreateTask, tasks }: CreateTaskSheetProps) {
  const parentOptions = useMemo(
    () => tasks.filter((task) => task.type === "phase" || task.type === "summary"),
    [tasks],
  );
  const assigneeOptions = useMemo(() => {
    const activeMembers = getActiveMembers(members);
    return activeMembers.length > 0 ? activeMembers : members;
  }, [members]);
  const form = useForm({
    defaultValues: {
      assigneeIds: assigneeOptions[0] ? [assigneeOptions[0].id] : [],
      effortHours: 40,
      end: "2025-06-07",
      parentId: parentOptions[0]?.id ?? "none",
      start: "2025-06-03",
      title: "新しい作業項目",
    } as TaskCreateFormValue,
    onSubmit: ({ value }) => {
      const input = taskCreateFormSchema.parse(value);
      onCreateTask({ ...input, parentId: input.parentId === "none" ? null : input.parentId });
    },
    validators: {
      onChange: taskCreateFormSchema,
      onSubmit: taskCreateFormSchema,
    },
  });

  useEffect(() => {
    const currentParentId = form.getFieldValue("parentId");
    if (!parentOptions.some((task) => task.id === currentParentId)) {
      form.setFieldValue("parentId", parentOptions[0]?.id ?? "none");
    }
  }, [form, parentOptions]);

  useEffect(() => {
    const availableIds = new Set(assigneeOptions.map((member) => member.id));
    const currentIds = form.getFieldValue("assigneeIds");
    const nextIds = currentIds.filter((memberId) => availableIds.has(memberId));
    if (nextIds.length !== currentIds.length || (nextIds.length === 0 && assigneeOptions[0])) {
      form.setFieldValue(
        "assigneeIds",
        nextIds.length > 0 ? nextIds : assigneeOptions[0] ? [assigneeOptions[0].id] : [],
      );
    }
  }, [assigneeOptions, form]);

  return (
    <aside className="create-sheet">
      <div className="panel-heading">
        <strong>タスク追加</strong>
        <button className="close-button" onClick={onClose} aria-label="閉じる" type="button">
          <XMarkIcon />
        </button>
      </div>
      <form.Field name="title">
        {(field) => (
          <label>
            タスク名
            <input
              aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              value={field.state.value}
            />
            <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
          </label>
        )}
      </form.Field>
      <form.Field name="parentId">
        {(field) => (
          <label>
            フェーズ
            <select
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              value={field.state.value}
            >
              {parentOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </form.Field>
      <div className="two-col">
        <form.Field name="start">
          {(field) => (
            <label>
              開始日
              <input
                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  field.handleChange(nextStart);
                  if (form.getFieldValue("end") < nextStart) {
                    form.setFieldValue("end", nextStart);
                  }
                }}
                type="date"
                value={field.state.value}
              />
              <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
            </label>
          )}
        </form.Field>
        <form.Field name="end">
          {(field) => (
            <label>
              終了日
              <input
                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                min={form.getFieldValue("start")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                type="date"
                value={field.state.value}
              />
              <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
            </label>
          )}
        </form.Field>
      </div>
      <form.Field name="assigneeIds">
        {(field) => (
          <div>
            <MemberChecklist
              members={assigneeOptions}
              onToggle={(memberId) =>
                field.handleChange(toggleAssignee(field.state.value, memberId))
              }
              selectedIds={field.state.value}
              title="担当者"
            />
            <FormFieldError
              errors={field.state.meta.errors}
              show={field.state.value.length === 0}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="effortHours">
        {(field) => (
          <label>
            予定工数
            <input
              aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              min="0"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(Number(event.target.value))}
              type="number"
              value={field.state.value}
            />
            <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
          </label>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.values] as const}>
        {([canSubmit, values]) => (
          <button
            className="primary-button full"
            disabled={!canSubmit || !values.title.trim() || values.assigneeIds.length === 0}
            onClick={() => void form.handleSubmit()}
            type="button"
          >
            タスクを追加
          </button>
        )}
      </form.Subscribe>
    </aside>
  );
}
