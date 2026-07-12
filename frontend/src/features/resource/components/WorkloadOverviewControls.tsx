import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import type { Team } from "../../../types/schedule";
import { formatYearPeriod, type CapacityFilter, type ViewMode } from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

export function WorkloadOverviewControls({
  capacityFilter,
  mode,
  onCapacityFilterChange,
  onNextPeriod,
  onPreviousPeriod,
  onTeamChange,
  periodEnd,
  periodStart,
  teamId,
  teams,
}: {
  capacityFilter: CapacityFilter;
  mode: ViewMode;
  onCapacityFilterChange: (filter: CapacityFilter) => void;
  onNextPeriod: () => void;
  onPreviousPeriod: () => void;
  onTeamChange: (teamId: string) => void;
  periodEnd: string;
  periodStart: string;
  teamId: string;
  teams: Team[];
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.filterControls}>
        {mode !== "team" ? (
          <select
            className={styles.select}
            aria-label="表示チーム"
            onChange={(event) => onTeamChange(event.target.value)}
            value={teamId}
          >
            <option value="all">すべてのチーム</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : null}
        {mode !== "plan" ? (
          <select
            aria-label="負荷状態"
            className={styles.capacitySelect}
            onChange={(event) => onCapacityFilterChange(event.target.value as CapacityFilter)}
            value={capacityFilter}
          >
            <option value="all">すべての負荷</option>
            <option value="overloaded">過負荷のみ</option>
            <option value="available">余力ありのみ</option>
          </select>
        ) : null}
      </div>
      <div className={styles.timelineControls}>
        <div className={styles.pager} aria-label="表示期間の切り替え">
          <button
            aria-label="前の期間"
            className={styles.pagerButton}
            onClick={onPreviousPeriod}
            type="button"
          >
            <ChevronLeftIcon className={styles.pagerIcon} />
          </button>
          <span className={styles.period}>{formatYearPeriod(periodStart, periodEnd)}</span>
          <button
            aria-label="次の期間"
            className={styles.pagerButton}
            onClick={onNextPeriod}
            type="button"
          >
            <ChevronRightIcon className={styles.pagerIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
