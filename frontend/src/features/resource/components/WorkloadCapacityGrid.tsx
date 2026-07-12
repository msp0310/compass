import { Avatar } from "../../../components/ui/Avatar";
import type { buildWeekColumns } from "../../../lib/schedule";
import type { ResourceRowModel, Team } from "../../../types/schedule";
import {
  aggregateTeamCapacityCell,
  buildMonthGroups,
  buildMonthWeekLabels,
  isCurrentWeek,
} from "../model/workloadPlanning";

import * as styles from "./WorkloadOverviewPage.css";

function TimelineHeader({
  entityLabel,
  todayKey,
  weeks,
}: {
  entityLabel: string;
  todayKey: string;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  const monthGroups = buildMonthGroups(weeks);
  const weekLabels = buildMonthWeekLabels(weeks);
  return (
    <>
      <div
        className={`${styles.cell} ${styles.head} ${styles.entityCell} ${styles.timelineEntityHead}`}
      >
        {entityLabel}
      </div>
      {monthGroups.map((month) => (
        <div
          className={`${styles.cell} ${styles.head} ${styles.monthHead}`}
          key={month.key}
          style={{ gridColumn: `span ${month.span}` }}
        >
          {month.label}
        </div>
      ))}
      {weeks.map((week, index) => (
        <div
          className={`${styles.cell} ${styles.head} ${styles.weekHead} ${isCurrentWeek(week.start, todayKey) ? styles.currentWeek : ""}`}
          key={week.key}
        >
          {weekLabels[index]}
        </div>
      ))}
    </>
  );
}

export function MemberCapacityGrid({
  onOpenProject,
  rows,
  todayKey,
  weeks,
}: {
  onOpenProject: (projectId: string) => void;
  rows: ResourceRowModel[];
  todayKey: string;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  return (
    <div className={styles.gridScroll}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `220px repeat(${weeks.length}, minmax(60px, 1fr))` }}
      >
        <TimelineHeader entityLabel="メンバー" todayKey={todayKey} weeks={weeks} />
        {rows.map((row) => (
          <MemberGridRow
            key={row.member.id}
            onOpenProject={onOpenProject}
            row={row}
            todayKey={todayKey}
          />
        ))}
      </div>
      {rows.length === 0 ? (
        <div className={styles.empty}>表示対象のメンバーがいません。</div>
      ) : null}
    </div>
  );
}

function MemberGridRow({
  onOpenProject,
  row,
  todayKey,
}: {
  onOpenProject: (projectId: string) => void;
  row: ResourceRowModel;
  todayKey: string;
}) {
  return (
    <>
      <div className={`${styles.cell} ${styles.entityCell}`}>
        <Avatar member={row.member} />
        <span className={styles.entityText}>
          <strong className={styles.entityName}>{row.member.name}</strong>
          <small className={styles.entityMeta}>{row.member.role}</small>
        </span>
      </div>
      {row.cells.map((cell) => (
        <LoadCell
          cell={cell}
          current={isCurrentWeek(cell.week, todayKey)}
          key={cell.week}
          onOpenProject={onOpenProject}
        />
      ))}
    </>
  );
}

export function TeamCapacityGrid({
  onOpenProject,
  onOpenTeam,
  rows,
  todayKey,
  weeks,
}: {
  onOpenProject: (projectId: string) => void;
  onOpenTeam: (teamId: string) => void;
  rows: { projectCount: number; rows: ResourceRowModel[]; team: Team }[];
  todayKey: string;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  return (
    <div className={styles.gridScroll}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `220px repeat(${weeks.length}, minmax(60px, 1fr))` }}
      >
        <TimelineHeader entityLabel="チーム" todayKey={todayKey} weeks={weeks} />
        {rows.map(({ projectCount, rows: memberRows, team }) => (
          <TeamGridRow
            key={team.id}
            memberRows={memberRows}
            onOpenProject={onOpenProject}
            onOpenTeam={onOpenTeam}
            projectCount={projectCount}
            team={team}
            todayKey={todayKey}
            weeks={weeks}
          />
        ))}
      </div>
    </div>
  );
}

function TeamGridRow({
  memberRows,
  onOpenProject,
  onOpenTeam,
  projectCount,
  team,
  todayKey,
  weeks,
}: {
  memberRows: ResourceRowModel[];
  onOpenProject: (projectId: string) => void;
  onOpenTeam: (teamId: string) => void;
  projectCount: number;
  team: Team;
  todayKey: string;
  weeks: ReturnType<typeof buildWeekColumns>;
}) {
  return (
    <>
      <div className={`${styles.cell} ${styles.entityCell}`}>
        <span className={styles.entityText}>
          <button className={styles.teamButton} onClick={() => onOpenTeam(team.id)} type="button">
            {team.name}
          </button>
          <small className={styles.entityMeta}>
            {projectCount}案件 / {memberRows.length}名
          </small>
        </span>
      </div>
      {weeks.map((week, index) => (
        <LoadCell
          cell={aggregateTeamCapacityCell(memberRows, index, week.key)}
          current={isCurrentWeek(week.start, todayKey)}
          key={week.key}
          onOpenProject={onOpenProject}
        />
      ))}
    </>
  );
}

function LoadCell({
  cell,
  current = false,
  onOpenProject,
}: {
  cell: ResourceRowModel["cells"][number];
  current?: boolean;
  onOpenProject: (projectId: string) => void;
}) {
  const projects = [
    ...new Map(
      cell.contributions
        .filter((item) => item.projectId)
        .map((item) => [item.projectId!, item.projectName ?? item.projectId!]),
    ).entries(),
  ].slice(0, 2);
  const tone =
    cell.percent >= 100 ? styles.loadDanger : cell.percent >= 82 ? styles.loadWarning : "";
  return (
    <div className={`${styles.cell} ${styles.weekCell} ${current ? styles.currentWeek : ""}`}>
      <div className={styles.loadLine}>
        <strong className={styles.loadValue}>{cell.percent}%</strong>
        <span className={styles.loadHours}>{cell.hours}h</span>
      </div>
      <div className={styles.loadTrack}>
        <div
          className={`${styles.loadBar} ${tone}`}
          style={{ width: `${Math.min(cell.percent, 100)}%` }}
        />
      </div>
      <div className={styles.projectLinks}>
        {projects.map(([id, name]) => (
          <button
            className={styles.projectLink}
            key={id}
            onClick={() => onOpenProject(id)}
            title={name}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
