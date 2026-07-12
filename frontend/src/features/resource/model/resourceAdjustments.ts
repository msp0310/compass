import type { ResourceCell, ResourceRowModel, UtilizationTone } from "../../../types/schedule";

/** 選択週の工数から、負荷軽減効果が大きいタスクと分担候補を導出します。 */
export function buildResourceAdjustmentSuggestions(
  cell: ResourceCell,
  currentMemberId: string,
  resourceRows: ResourceRowModel[],
) {
  return cell.contributions
    .map((contribution) => {
      const nextHours = Math.max(cell.hours - contribution.hours, 0);
      const nextPercent = calculateResourcePercent(nextHours, cell.capacityHours);
      return {
        contribution,
        nextHours,
        nextPercent,
        reliefHours: contribution.hours,
        shareCandidates:
          contribution.assigneeCount === 1
            ? buildResourceShareCandidates(cell, contribution.hours, currentMemberId, resourceRows)
            : [],
      };
    })
    .toSorted(
      (a, b) =>
        b.reliefHours - a.reliefHours || a.contribution.start.localeCompare(b.contribution.start),
    )
    .slice(0, 3);
}

export function findResourceCell(resourceRows: ResourceRowModel[], selectedCellKey: string | null) {
  if (!selectedCellKey) {
    return null;
  }
  for (const row of resourceRows) {
    for (const cell of row.cells) {
      if (getResourceCellKey(row.member.id, cell.week) === selectedCellKey) {
        return { cell, row };
      }
    }
  }
  return null;
}

export function getResourceCellKey(memberId: string, week: string) {
  return `${memberId}:${week}`;
}

export function formatResourceHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function getLoadTone(value: number): UtilizationTone {
  if (value >= 90) {
    return "danger";
  }
  if (value >= 80) {
    return "warning";
  }
  return "good";
}

function buildResourceShareCandidates(
  cell: ResourceCell,
  contributionHours: number,
  currentMemberId: string,
  resourceRows: ResourceRowModel[],
) {
  const sharedHours = contributionHours / 2;
  const currentNextHours = Math.max(cell.hours - sharedHours, 0);
  const currentNextPercent = calculateResourcePercent(currentNextHours, cell.capacityHours);
  return resourceRows
    .filter((row) => row.member.id !== currentMemberId)
    .map((row) => {
      const targetCell = row.cells.find((candidate) => candidate.week === cell.week);
      const targetCurrentHours = targetCell?.hours ?? 0;
      const targetCapacityHours = targetCell?.capacityHours ?? Math.round(row.member.capacityHours);
      const targetCurrentPercent = calculateResourcePercent(
        targetCurrentHours,
        targetCapacityHours,
      );
      const targetNextHours = targetCurrentHours + sharedHours;
      const targetNextPercent = calculateResourcePercent(targetNextHours, targetCapacityHours);
      return {
        currentNextHours,
        currentNextPercent,
        member: row.member,
        targetCurrentHours,
        targetCurrentPercent,
        targetNextHours,
        targetNextPercent,
        tone: getLoadTone(targetNextPercent),
      };
    })
    .toSorted(
      (a, b) =>
        Math.max(a.currentNextPercent, a.targetNextPercent) -
          Math.max(b.currentNextPercent, b.targetNextPercent) ||
        a.targetNextPercent - b.targetNextPercent ||
        a.targetCurrentPercent - b.targetCurrentPercent ||
        a.member.name.localeCompare(b.member.name),
    )
    .slice(0, 3);
}

function calculateResourcePercent(hours: number, capacityHours: number) {
  if (capacityHours <= 0) {
    return hours > 0 ? 100 : 0;
  }
  return Math.round((hours / capacityHours) * 100);
}
