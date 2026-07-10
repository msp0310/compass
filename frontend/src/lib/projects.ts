import { isMemberActive } from "./members";
import type {
  Member,
  Project,
  ProjectLifecycleStatus,
  Team,
} from "../types/schedule";

export const projectLifecycleLabels: Record<ProjectLifecycleStatus, string> = {
  completed: "完了済み",
  inProgress: "進行中",
  planning: "計画",
};

export const projectLifecycleOptions: {
  label: string;
  value: ProjectLifecycleStatus;
}[] = [
  { label: projectLifecycleLabels.planning, value: "planning" },
  { label: projectLifecycleLabels.inProgress, value: "inProgress" },
  { label: projectLifecycleLabels.completed, value: "completed" },
];

/** getProjectLifecycleStatusを実行し、アプリケーション用の値を返します。 */
export function getProjectLifecycleStatus(
  project: Project,
): ProjectLifecycleStatus {
  return project.lifecycleStatus ?? "inProgress";
}

/** getProjectMemberIdsを実行し、アプリケーション用の値を返します。 */
export function getProjectMemberIds(project: Project, team?: Team) {
  return project.memberIds ?? team?.memberIds ?? [];
}

/** getProjectAssignedMembersを実行し、アプリケーション用の値を返します。 */
export function getProjectAssignedMembers({
  includeInactive = false,
  members,
  project,
  team,
}: {
  includeInactive?: boolean;
  members: Member[];
  project: Project;
  team?: Team;
}) {
  const memberIds = new Set(getProjectMemberIds(project, team));
  return members.filter(
    (member) =>
      memberIds.has(member.id) && (includeInactive || isMemberActive(member)),
  );
}
