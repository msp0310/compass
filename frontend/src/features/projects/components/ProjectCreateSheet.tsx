import { CalendarDaysIcon, RectangleStackIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "@tanstack/react-form";

import { FormFieldError } from "../../../components/forms/FormFieldError";
import { type ProjectTemplateId, projectTemplates } from "../../../data/projectTemplates";
import type { Team } from "../../../types/schedule";
import { type ProjectCreateFormValue, projectCreateFormSchema } from "../model/projectFormSchemas";

export type CreateProjectTemplateInput = {
  projectName: string;
  projectNo: string;
  startDate: string;
  templateId: ProjectTemplateId;
  workspace: string;
};

type ProjectCreateSheetProps = {
  defaultStartDate: string;
  nextProjectIndex: number;
  onClose: () => void;
  onCreateProject: (input: CreateProjectTemplateInput) => void;
  team?: Team;
};

/** テンプレートから新しいプロジェクトを作成する画面です。 */
export function ProjectCreateSheet({
  defaultStartDate,
  nextProjectIndex,
  onClose,
  onCreateProject,
  team,
}: ProjectCreateSheetProps) {
  const form = useForm({
    defaultValues: {
      projectName: "SI案件 プロジェクト管理",
      projectNo: "",
      startDate: defaultStartDate,
      templateId: "standard-si",
      workspace: `新規SIプロジェクト ${nextProjectIndex}`,
    } as ProjectCreateFormValue,
    onSubmit: ({ value }) => onCreateProject(projectCreateFormSchema.parse(value)),
    validators: {
      onChange: projectCreateFormSchema,
      onSubmit: projectCreateFormSchema,
    },
  });

  return (
    <aside className="project-create-sheet">
      <div className="panel-heading">
        <strong>プロジェクト追加</strong>
        <button aria-label="閉じる" className="close-button" onClick={onClose} type="button">
          <XMarkIcon />
        </button>
      </div>
      <div className="project-create-team">
        <span>{team?.code ?? "未"}</span>
        <div>
          <strong>{team?.name ?? "未所属"}</strong>
          <small>{team ? `${team.memberIds.length}名のチーム` : "所属チームなし"}</small>
        </div>
      </div>
      <form.Field name="workspace">
        {(field) => (
          <label className="field-stack">
            プロジェクト名
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
      <form.Field name="projectNo">
        {(field) => (
          <label className="field-stack">
            プロジェクトNo.
            <input
              aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
              autoComplete="off"
              maxLength={64}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="例: PJ-2026-001"
              value={field.state.value}
            />
            <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
          </label>
        )}
      </form.Field>
      <form.Field name="projectName">
        {(field) => (
          <label className="field-stack">
            管理名
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
      <form.Field name="startDate">
        {(field) => (
          <label className="field-stack">
            開始日
            <span className="date-input-with-icon">
              <CalendarDaysIcon />
              <input
                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                type="date"
                value={field.state.value}
              />
            </span>
            <FormFieldError errors={field.state.meta.errors} show={field.state.meta.isTouched} />
          </label>
        )}
      </form.Field>
      <section className="project-template-picker">
        <div className="project-template-heading">
          <span>テンプレート</span>
          <small>{projectTemplates.length}件</small>
        </div>
        <form.Field name="templateId">
          {(field) => (
            <div className="project-template-grid">
              {projectTemplates.map((template) => (
                <button
                  aria-pressed={field.state.value === template.id}
                  className={field.state.value === template.id ? "selected" : ""}
                  key={template.id}
                  onClick={() => field.handleChange(template.id)}
                  type="button"
                >
                  <RectangleStackIcon />
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                  <small>
                    {template.taskCount}行 / {template.durationLabel}
                  </small>
                </button>
              ))}
            </div>
          )}
        </form.Field>
      </section>
      <form.Subscribe selector={(state) => [state.canSubmit, state.values] as const}>
        {([canSubmit, values]) => (
          <button
            className="primary-button full"
            disabled={
              !canSubmit ||
              !values.workspace.trim() ||
              !values.projectName.trim() ||
              !values.startDate
            }
            onClick={() => void form.handleSubmit()}
            type="button"
          >
            プロジェクトを作成
          </button>
        )}
      </form.Subscribe>
    </aside>
  );
}
