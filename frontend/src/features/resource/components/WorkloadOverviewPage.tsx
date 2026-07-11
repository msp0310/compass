import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import type { ScheduleSnapshot } from "../../../data/scheduleRepository";
import { buildCrossProjectResourceRows } from "../../../lib/resourceCalculations";
import { buildTimeline, buildWeekColumns } from "../../../lib/schedule";
import { isMemberActive } from "../../../lib/members";
import type { CalendarDefinition, Member, ResourceRowModel, Team } from "../../../types/schedule";
import { Avatar } from "../../../components/ui/Avatar";
import * as styles from "./WorkloadOverviewPage.css";

type WorkloadOverviewPageProps = {
  calendar: CalendarDefinition;
  calendarAware: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenTeam: (teamId: string) => void;
  schedules: ScheduleSnapshot[];
  teams: Team[];
};

type ViewMode = "member" | "team";

/** 全案件をメンバーまたはチーム単位で横断して、週次負荷を比較します。 */
export function WorkloadOverviewPage({
  calendar,
  calendarAware,
  onOpenProject,
  onOpenTeam,
  schedules,
  teams,
}: WorkloadOverviewPageProps) {
  const [mode, setMode] = useState<ViewMode>("member");
  const [teamId, setTeamId] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const activeSchedules = useMemo(
    () => schedules.filter((snapshot) => snapshot.project.status !== "archived"),
    [schedules],
  );
  const members = useMemo(() => collectMembers(activeSchedules), [activeSchedules]);
  const weeks = useMemo(() => {
    const start = activeSchedules.map((item) => item.project.rangeStart).sort()[0];
    const end = activeSchedules.map((item) => item.project.rangeEnd).sort().at(-1);
    if (!start || !end) return [];
    return buildWeekColumns(buildTimeline(start, end, calendar, calendarAware, "day"));
  }, [activeSchedules, calendar, calendarAware]);
  const maxOffset = Math.max(weeks.length - 6, 0);
  const visibleOffset = Math.min(weekOffset, maxOffset);
  const visibleWeeks = weeks.slice(visibleOffset, visibleOffset + 6);
  const scopedSchedules = useMemo(
    () =>
      teamId === "all"
        ? activeSchedules
        : activeSchedules.filter((item) => item.project.teamId === teamId),
    [activeSchedules, teamId],
  );
  const scopedMembers = useMemo(
    () => getScopedMembers(members, scopedSchedules, teams.find((team) => team.id === teamId)),
    [members, scopedSchedules, teamId, teams],
  );
  const memberRows = useMemo(
    () =>
      buildCrossProjectResourceRows({
        baseCalendar: calendar,
        calendarAware,
        members: scopedMembers,
        schedules: scopedSchedules,
        weeks: visibleWeeks,
      }),
    [calendar, calendarAware, scopedMembers, scopedSchedules, visibleWeeks],
  );
  const teamRows = useMemo(
    () =>
      teams.map((team) => {
        const teamSchedules = activeSchedules.filter((item) => item.project.teamId === team.id);
        const teamMembers = getScopedMembers(members, teamSchedules, team);
        const rows = buildCrossProjectResourceRows({
          baseCalendar: calendar,
          calendarAware,
          members: teamMembers,
          schedules: teamSchedules,
          weeks: visibleWeeks,
        });
        return { rows, team, projectCount: teamSchedules.length };
      }),
    [activeSchedules, calendar, calendarAware, members, teams, visibleWeeks],
  );
  const overloadedCount =
    mode === "member"
      ? memberRows.filter((row) => row.cells.some((cell) => cell.percent >= 100)).length
      : teamRows.filter((item) =>
          visibleWeeks.some(
            (week, index) => aggregateTeamCell(item.rows, index, week.key).percent >= 100,
          ),
        ).length;
  const availableCount =
    mode === "member"
      ? memberRows.filter((row) => row.cells.every((cell) => cell.percent < 70)).length
      : teamRows.filter((item) =>
          visibleWeeks.every(
            (week, index) => aggregateTeamCell(item.rows, index, week.key).percent < 70,
          ),
        ).length;
  const unassignedCount = scopedSchedules.reduce(
    (count, snapshot) => count + snapshot.tasks.filter((task) => task.type === "task" && task.assigneeIds.length === 0).length,
    0,
  );

  return (
    <section className={styles.page} aria-label="稼働状況">
      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>稼働状況</h2>
          <span className={styles.description}>全案件の予定工数を、人とチームの軸で週次集計</span>
        </div>
        <div className={styles.segmented} aria-label="稼働状況の表示軸">
          <button className={`${styles.segment} ${mode === "member" ? styles.segmentActive : ""}`} onClick={() => setMode("member")} type="button">人別</button>
          <button className={`${styles.segment} ${mode === "team" ? styles.segmentActive : ""}`} onClick={() => setMode("team")} type="button">チーム別</button>
        </div>
      </header>

      <div className={styles.summary}>
        <Summary label={mode === "member" ? "表示メンバー" : "表示チーム"} value={mode === "member" ? `${memberRows.length}名` : `${teamRows.length}チーム`} />
        <Summary label="稼働超過" value={`${overloadedCount}${mode === "member" ? "名" : "チーム"}`} />
        <Summary label="余力あり" value={`${availableCount}${mode === "member" ? "名" : "チーム"}`} />
        <Summary label="未アサインタスク" value={`${unassignedCount}件`} />
      </div>

      <div className={styles.controls}>
        {mode === "member" ? (
          <select className={styles.select} aria-label="表示チーム" onChange={(event) => setTeamId(event.target.value)} value={teamId}>
            <option value="all">すべてのチーム</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        ) : <span />}
        <div className={styles.pager} aria-label="表示週の切り替え">
          <button aria-label="前の期間" className={styles.pagerButton} disabled={visibleOffset === 0} onClick={() => setWeekOffset(Math.max(visibleOffset - 3, 0))} type="button"><ChevronLeftIcon className={styles.pagerIcon} /></button>
          <span className={styles.period}>{formatPeriod(visibleWeeks)}</span>
          <button aria-label="次の期間" className={styles.pagerButton} disabled={visibleOffset >= maxOffset} onClick={() => setWeekOffset(Math.min(visibleOffset + 3, maxOffset))} type="button"><ChevronRightIcon className={styles.pagerIcon} /></button>
        </div>
      </div>

      {mode === "member" ? (
        <MemberGrid onOpenProject={onOpenProject} rows={memberRows} weeks={visibleWeeks} />
      ) : (
        <TeamGrid onOpenProject={onOpenProject} onOpenTeam={onOpenTeam} rows={teamRows} weeks={visibleWeeks} />
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <article className={styles.summaryItem}><span className={styles.summaryLabel}>{label}</span><strong className={styles.summaryValue}>{value}</strong></article>;
}

function MemberGrid({ onOpenProject, rows, weeks }: { onOpenProject: (projectId: string) => void; rows: ResourceRowModel[]; weeks: ReturnType<typeof buildWeekColumns> }) {
  return (
    <div className={styles.gridScroll}>
      <div className={styles.grid} style={{ gridTemplateColumns: `220px repeat(${weeks.length}, minmax(126px, 1fr))` }}>
        <div className={`${styles.cell} ${styles.head} ${styles.entityCell}`}>メンバー</div>
        {weeks.map((week) => <div className={`${styles.cell} ${styles.head}`} key={week.key}>{week.label}</div>)}
        {rows.map((row) => <MemberGridRow key={row.member.id} onOpenProject={onOpenProject} row={row} />)}
      </div>
      {rows.length === 0 ? <div className={styles.empty}>表示対象のメンバーがいません。</div> : null}
    </div>
  );
}

function MemberGridRow({ onOpenProject, row }: { onOpenProject: (projectId: string) => void; row: ResourceRowModel }) {
  return <><div className={`${styles.cell} ${styles.entityCell}`}><Avatar member={row.member} /><span className={styles.entityText}><strong className={styles.entityName}>{row.member.name}</strong><small className={styles.entityMeta}>{row.member.role}</small></span></div>{row.cells.map((cell) => <LoadCell cell={cell} key={cell.week} onOpenProject={onOpenProject} />)}</>;
}

function TeamGrid({ onOpenProject, onOpenTeam, rows, weeks }: { onOpenProject: (projectId: string) => void; onOpenTeam: (teamId: string) => void; rows: Array<{ projectCount: number; rows: ResourceRowModel[]; team: Team }>; weeks: ReturnType<typeof buildWeekColumns> }) {
  return <div className={styles.gridScroll}><div className={styles.grid} style={{ gridTemplateColumns: `220px repeat(${weeks.length}, minmax(126px, 1fr))` }}><div className={`${styles.cell} ${styles.head} ${styles.entityCell}`}>チーム</div>{weeks.map((week) => <div className={`${styles.cell} ${styles.head}`} key={week.key}>{week.label}</div>)}{rows.map(({ projectCount, rows: memberRows, team }) => <TeamGridRow key={team.id} memberRows={memberRows} onOpenProject={onOpenProject} onOpenTeam={onOpenTeam} projectCount={projectCount} team={team} weeks={weeks} />)}</div></div>;
}

function TeamGridRow({ memberRows, onOpenProject, onOpenTeam, projectCount, team, weeks }: { memberRows: ResourceRowModel[]; onOpenProject: (projectId: string) => void; onOpenTeam: (teamId: string) => void; projectCount: number; team: Team; weeks: ReturnType<typeof buildWeekColumns> }) {
  return <><div className={`${styles.cell} ${styles.entityCell}`}><span className={styles.entityText}><button className={styles.teamButton} onClick={() => onOpenTeam(team.id)} type="button">{team.name}</button><small className={styles.entityMeta}>{projectCount}案件 / {memberRows.length}名</small></span></div>{weeks.map((week, index) => <LoadCell cell={aggregateTeamCell(memberRows, index, week.key)} key={week.key} onOpenProject={onOpenProject} />)}</>;
}

function LoadCell({ cell, onOpenProject }: { cell: ResourceRowModel["cells"][number]; onOpenProject: (projectId: string) => void }) {
  const projects = [...new Map(cell.contributions.filter((item) => item.projectId).map((item) => [item.projectId!, item.projectName ?? item.projectId!])).entries()].slice(0, 2);
  const tone = cell.percent >= 100 ? styles.loadDanger : cell.percent >= 82 ? styles.loadWarning : "";
  return <div className={`${styles.cell} ${styles.weekCell}`}><div className={styles.loadLine}><strong className={styles.loadValue}>{cell.percent}%</strong><span className={styles.loadHours}>{cell.hours}h</span></div><div className={styles.loadTrack}><div className={`${styles.loadBar} ${tone}`} style={{ width: `${Math.min(cell.percent, 100)}%` }} /></div><div className={styles.projectLinks}>{projects.map(([id, name]) => <button className={styles.projectLink} key={id} onClick={() => onOpenProject(id)} title={name} type="button">{name}</button>)}</div></div>;
}

function aggregateTeamCell(rows: ResourceRowModel[], index: number, week: string): ResourceRowModel["cells"][number] {
  const cells = rows.map((row) => row.cells[index]).filter(Boolean);
  const hours = cells.reduce((sum, cell) => sum + cell.hours, 0);
  const capacityHours = cells.reduce((sum, cell) => sum + cell.capacityHours, 0);
  const percent = capacityHours > 0 ? Math.round((hours / capacityHours) * 100) : 0;
  return { week, hours, capacityHours, percent, tone: percent >= 100 ? "danger" : percent >= 82 ? "warning" : "good", unavailableDays: cells.reduce((sum, cell) => sum + cell.unavailableDays, 0), contributions: cells.flatMap((cell) => cell.contributions) };
}

function collectMembers(schedules: ScheduleSnapshot[]): Member[] {
  const members = new Map<string, Member>();
  schedules.forEach((snapshot) => snapshot.members.forEach((member) => members.set(member.id, member)));
  return [...members.values()].filter(isMemberActive);
}

function getScopedMembers(members: Member[], schedules: ScheduleSnapshot[], team?: Team): Member[] {
  const assignedIds = new Set(schedules.flatMap((snapshot) => snapshot.tasks.flatMap((task) => task.assigneeIds)));
  const teamIds = new Set(team?.memberIds ?? []);
  return members.filter((member) => !team || teamIds.has(member.id) || assignedIds.has(member.id));
}

function formatPeriod(weeks: ReturnType<typeof buildWeekColumns>) {
  if (weeks.length === 0) return "対象期間なし";
  return `${weeks[0]?.label ?? ""} - ${weeks.at(-1)?.label ?? ""}`;
}
