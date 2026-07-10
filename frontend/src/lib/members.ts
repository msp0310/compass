import type { Member } from "../types/schedule";

/** isMemberActiveを実行し、アプリケーション用の値を返します。 */
export function isMemberActive(member: Pick<Member, "status">) {
  return member.status !== "inactive";
}

/** getActiveMembersを実行し、アプリケーション用の値を返します。 */
export function getActiveMembers(members: Member[]) {
  return members.filter(isMemberActive);
}

/** getAssignableMembersを実行し、アプリケーション用の値を返します。 */
export function getAssignableMembers(members: Member[], selectedIds: string[] = []) {
  const selectedIdSet = new Set(selectedIds);
  return members.filter(
    (member) => isMemberActive(member) || selectedIdSet.has(member.id),
  );
}

/** getMemberStatusLabelを実行し、アプリケーション用の値を返します。 */
export function getMemberStatusLabel(member: Pick<Member, "status">) {
  return isMemberActive(member) ? "有効" : "休止中";
}
