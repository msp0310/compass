import { useMemo, useState } from "react";

import type {
  ResourceDisplaySettings,
  ResourceRowModel,
  ResourceScope,
  TaskInspectorFocusTarget,
  TimelineColumn,
} from "../../../types/schedule";
import { findResourceCell, getResourceCellKey } from "../model/resourceAdjustments";
import { ResourceDrilldown } from "./ResourceDrilldown";
import { ResourceGrid } from "./ResourceGrid";
import { ResourcePanelHeader } from "./ResourcePanelHeader";

type ResourcePanelProps = {
  displaySettings: ResourceDisplaySettings;
  onDisplaySettingsChange: (settings: ResourceDisplaySettings) => void;
  onMoveTask: (taskId: string, deltaDays: number) => void;
  onScopeChange: (scope: ResourceScope) => void;
  onSelectTask: (
    taskId: string,
    focusTarget?: TaskInspectorFocusTarget,
    projectId?: string,
  ) => void;
  onShareTask: (taskId: string, memberId: string) => void;
  resourceRows: ResourceRowModel[];
  scope: ResourceScope;
  scopeDescription: string;
  scopeLabel: string;
  weeks: TimelineColumn[];
};

/** メンバー別の週次負荷と選択セルの調整候補を構成します。 */
export function ResourcePanel({
  displaySettings,
  onDisplaySettingsChange,
  onMoveTask,
  onScopeChange,
  onSelectTask,
  onShareTask,
  resourceRows,
  scope,
  scopeDescription,
  scopeLabel,
  weeks,
}: ResourcePanelProps) {
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const selectedCell = useMemo(
    () => findResourceCell(resourceRows, selectedCellKey),
    [resourceRows, selectedCellKey],
  );
  const selectedWeekLabel = selectedCell
    ? (weeks.find((week) => week.key === selectedCell.cell.week)?.label ?? selectedCell.cell.week)
    : "";

  return (
    <section
      className={displaySettings.compact ? "resource-panel compact" : "resource-panel"}
      aria-label="チームの作業量"
    >
      <ResourcePanelHeader
        displaySettings={displaySettings}
        onDisplaySettingsChange={onDisplaySettingsChange}
        onScopeChange={onScopeChange}
        scope={scope}
        scopeDescription={scopeDescription}
        scopeLabel={scopeLabel}
      />
      {selectedCell ? (
        <ResourceDrilldown
          cell={selectedCell.cell}
          currentMemberId={selectedCell.row.member.id}
          memberName={selectedCell.row.member.name}
          onClose={() => setSelectedCellKey(null)}
          onMoveTask={onMoveTask}
          onSelectTask={onSelectTask}
          onShareTask={onShareTask}
          resourceRows={resourceRows}
          scope={scope}
          weekLabel={selectedWeekLabel}
        />
      ) : null}
      <ResourceGrid
        onSelectCell={(memberId, cell) =>
          setSelectedCellKey(getResourceCellKey(memberId, cell.week))
        }
        resourceRows={resourceRows}
        selectedCellKey={selectedCellKey}
        showHours={displaySettings.showHours}
        showPercent={displaySettings.showPercent}
        warningThreshold={displaySettings.warningThreshold}
        weeks={weeks}
      />
    </section>
  );
}
