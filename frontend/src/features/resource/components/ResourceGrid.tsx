import { Avatar } from "../../../components/ui/Avatar";
import type { ResourceCell, ResourceRowModel, TimelineColumn } from "../../../types/schedule";
import { getLoadTone, getResourceCellKey } from "../model/resourceAdjustments";

export function ResourceGrid({
  onSelectCell,
  resourceRows,
  selectedCellKey,
  showHours,
  showPercent,
  warningThreshold,
  weeks,
}: {
  onSelectCell: (memberId: string, cell: ResourceCell) => void;
  resourceRows: ResourceRowModel[];
  selectedCellKey: string | null;
  showHours: boolean;
  showPercent: boolean;
  warningThreshold: number;
  weeks: TimelineColumn[];
}) {
  return (
    <div
      className="resource-grid"
      style={{
        gridTemplateColumns: `150px 126px 82px repeat(${weeks.length}, minmax(112px, 1fr))`,
      }}
    >
      <div className="resource-head member-col">メンバー</div>
      <div className="resource-head role-col">ロール</div>
      <div className="resource-head load-col">稼働率</div>
      {weeks.map((week) => (
        <div className="resource-head week-col" key={week.key}>
          <strong>{week.label.split(" ")[0]}</strong>
          <span>{week.label.split(" ")[1]}</span>
        </div>
      ))}
      {resourceRows.map((row) => (
        <ResourceRow
          key={row.member.id}
          row={row}
          showHours={showHours}
          showPercent={showPercent}
          selectedCellKey={selectedCellKey}
          onSelectCell={(cell) => onSelectCell(row.member.id, cell)}
          warningThreshold={warningThreshold}
        />
      ))}
    </div>
  );
}

function ResourceRow({
  onSelectCell,
  row,
  selectedCellKey,
  showHours,
  showPercent,
  warningThreshold,
}: {
  onSelectCell: (cell: ResourceCell) => void;
  row: ResourceRowModel;
  selectedCellKey: string | null;
  showHours: boolean;
  showPercent: boolean;
  warningThreshold: number;
}) {
  return (
    <>
      <div className="resource-cell member-col">
        <Avatar member={row.member} />
        <strong>{row.member.name}</strong>
      </div>
      <div className="resource-cell role-col">{row.member.role}</div>
      <div className={`resource-cell load-col load-${getLoadTone(row.utilization)}`}>
        {row.utilization}%
      </div>
      {row.cells.map((cell) => {
        const cellKey = getResourceCellKey(row.member.id, cell.week);
        const hasContributions = cell.contributions.length > 0;
        return (
          <button
            aria-pressed={selectedCellKey === cellKey}
            className={[
              "resource-cell week-col",
              cell.percent >= warningThreshold ? "over-threshold" : "",
              selectedCellKey === cellKey ? "selected" : "",
              hasContributions ? "has-contributions" : "empty",
            ]
              .filter(Boolean)
              .join(" ")}
            data-resource-cell={cellKey}
            disabled={!hasContributions}
            key={cell.week}
            onClick={() => onSelectCell(cell)}
            title={
              hasContributions
                ? `${row.member.name} / ${cell.week} / ${cell.contributions.length}件`
                : `${row.member.name} / ${cell.week} / 工数なし`
            }
            type="button"
          >
            <span className="capacity-line" />
            <span
              className={`load-bar ${cell.tone}`}
              style={{ width: `${Math.min(cell.percent, 118)}%` }}
            />
            {showHours || showPercent ? (
              <small>
                {showHours ? `${cell.hours}h` : ""}
                {showHours && showPercent ? " / " : ""}
                {showPercent ? `${cell.percent}%` : ""}
              </small>
            ) : null}
            <em>
              枠 {cell.capacityHours}h
              {cell.unavailableDays > 0 ? ` / 休${cell.unavailableDays}日` : ""}
            </em>
            {hasContributions ? (
              <span className="resource-task-count">{cell.contributions.length}件</span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}
