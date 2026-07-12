import { XMarkIcon } from "@heroicons/react/24/outline";

import { Avatar } from "../../../components/ui/Avatar";
import { formatShortDate, statusLabels } from "../../../lib/schedule";
import type {
  ResourceCell,
  ResourceRowModel,
  ResourceScope,
  TaskInspectorFocusTarget,
} from "../../../types/schedule";
import {
  buildResourceAdjustmentSuggestions,
  formatResourceHours,
} from "../model/resourceAdjustments";

export function ResourceDrilldown({
  cell,
  currentMemberId,
  memberName,
  onClose,
  onMoveTask,
  onSelectTask,
  onShareTask,
  resourceRows,
  scope,
  weekLabel,
}: {
  cell: ResourceCell;
  currentMemberId: string;
  memberName: string;
  onClose: () => void;
  onMoveTask: (taskId: string, deltaDays: number) => void;
  onSelectTask: (
    taskId: string,
    focusTarget?: TaskInspectorFocusTarget,
    projectId?: string,
  ) => void;
  onShareTask: (taskId: string, memberId: string) => void;
  resourceRows: ResourceRowModel[];
  scope: ResourceScope;
  weekLabel: string;
}) {
  const suggestions = buildResourceAdjustmentSuggestions(cell, currentMemberId, resourceRows);
  return (
    <section className="resource-drilldown" aria-label="リソース内訳">
      <div className="resource-drilldown-heading">
        <div>
          <strong>{memberName} の工数内訳</strong>
          <span>
            {weekLabel} / {cell.hours}h / {cell.percent}% / 枠{cell.capacityHours}h
          </span>
        </div>
        <button
          aria-label="工数内訳を閉じる"
          className="icon-button"
          onClick={onClose}
          type="button"
        >
          <XMarkIcon />
        </button>
      </div>
      {suggestions.length > 0 ? (
        <div className="resource-adjustment-panel">
          <div className="resource-adjustment-summary">
            <strong>調整候補</strong>
            <span>この週の負荷を下げる効果が大きい順に表示</span>
          </div>
          <div className="resource-suggestion-list">
            {suggestions.map((suggestion) => (
              <article
                className="resource-suggestion-card"
                key={`${suggestion.contribution.projectId ?? "current"}-${suggestion.contribution.taskId}`}
              >
                <div className="resource-suggestion-main">
                  <strong>{suggestion.contribution.title}</strong>
                  <span>
                    {formatShortDate(suggestion.contribution.start)} -{" "}
                    {formatShortDate(suggestion.contribution.end)} /{" "}
                    {statusLabels[suggestion.contribution.status]} / 配分
                    {suggestion.contribution.allocationPercent}%
                  </span>
                </div>
                <div className="resource-suggestion-impact">
                  <strong>-{formatResourceHours(suggestion.reliefHours)}</strong>
                  <span>
                    {formatResourceHours(cell.hours)}
                    {" -> "}
                    {formatResourceHours(suggestion.nextHours)} / {cell.percent}%{" -> "}
                    {suggestion.nextPercent}%
                  </span>
                </div>
                <div className="resource-suggestion-actions">
                  <button
                    className="subtle-action"
                    onClick={() =>
                      onSelectTask(
                        suggestion.contribution.taskId,
                        "assignees",
                        suggestion.contribution.projectId,
                      )
                    }
                    type="button"
                  >
                    担当
                  </button>
                  {suggestion.contribution.assigneeCount > 1 ? (
                    <button
                      className="subtle-action"
                      onClick={() =>
                        onSelectTask(
                          suggestion.contribution.taskId,
                          "allocations",
                          suggestion.contribution.projectId,
                        )
                      }
                      type="button"
                    >
                      配分
                    </button>
                  ) : null}
                  {scope === "project" ? (
                    <>
                      <button
                        className="subtle-action"
                        onClick={() => onMoveTask(suggestion.contribution.taskId, -1)}
                        type="button"
                      >
                        1日前
                      </button>
                      <button
                        className="subtle-action"
                        onClick={() => onMoveTask(suggestion.contribution.taskId, 1)}
                        type="button"
                      >
                        1日後ろ
                      </button>
                    </>
                  ) : null}
                </div>
                {scope === "project" && suggestion.shareCandidates.length > 0 ? (
                  <div className="resource-share-candidates">
                    <span>分担候補</span>
                    <div className="resource-share-actions">
                      {suggestion.shareCandidates.map((candidate) => (
                        <button
                          className={`resource-share-button ${candidate.tone}`}
                          key={candidate.member.id}
                          onClick={() =>
                            onShareTask(suggestion.contribution.taskId, candidate.member.id)
                          }
                          title={`${candidate.member.name} と50/50で分担: ${formatResourceHours(
                            cell.hours,
                          )} -> ${formatResourceHours(
                            candidate.currentNextHours,
                          )} / ${candidate.targetCurrentPercent}% -> ${candidate.targetNextPercent}%`}
                          type="button"
                        >
                          <Avatar member={candidate.member} />
                          <span>
                            <strong>{candidate.member.name}</strong>
                            <small>
                              自分 {formatResourceHours(candidate.currentNextHours)} / 相手{" "}
                              {formatResourceHours(candidate.targetNextHours)}・
                              {candidate.targetNextPercent}%
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="resource-drilldown-list">
        {cell.contributions.map((contribution) => (
          <button
            className="resource-contribution-row"
            key={`${contribution.projectId ?? "current"}-${contribution.taskId}`}
            onClick={() =>
              onSelectTask(
                contribution.taskId,
                contribution.assigneeCount > 1 ? "allocations" : "assignees",
                contribution.projectId,
              )
            }
            type="button"
          >
            <div>
              <strong>{contribution.title}</strong>
              <span>
                {formatShortDate(contribution.start)} - {formatShortDate(contribution.end)} /{" "}
                {statusLabels[contribution.status]} / 進捗
                {contribution.progress}%
                {contribution.projectName ? ` / ${contribution.projectName}` : ""}
              </span>
            </div>
            <small>
              {formatResourceHours(contribution.hours)}
              <em>{contribution.allocationPercent}%</em>
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
