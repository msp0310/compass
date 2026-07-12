import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

import {
  fetchJapanesePublicHolidays,
  mergeCalendarHolidays,
} from "../../../../data/publicHolidays";
import type { CalendarDefinition, CalendarHoliday, Team } from "../../../../types/schedule";
import { formatHolidayDate, weekdays } from "../../model/masterSettings";

type CalendarSettingsSectionProps = {
  active: boolean;
  activeTeamProjectCount: number;
  baseDate: string;
  calendar: CalendarDefinition;
  onSaveCalendar: (calendar: CalendarDefinition) => void;
  team: Team;
};

/** 稼働曜日、会社休日、祝日取込をカレンダー編集境界に閉じ込めます。 */
export function CalendarSettingsSection({
  active,
  activeTeamProjectCount,
  baseDate,
  calendar,
  onSaveCalendar,
  team,
}: CalendarSettingsSectionProps) {
  const [name, setName] = useState(calendar.name);
  const [workWeek, setWorkWeek] = useState<number[]>(calendar.workWeek);
  const [holidays, setHolidays] = useState<CalendarHoliday[]>(calendar.holidays);
  const [holidayDate, setHolidayDate] = useState(calendar.holidays[0]?.date ?? baseDate);
  const [holidayName, setHolidayName] = useState("会社休日");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const sortedHolidays = useMemo(
    () => [...holidays].toSorted((left, right) => left.date.localeCompare(right.date)),
    [holidays],
  );

  useEffect(() => {
    setName(calendar.name);
    setWorkWeek(calendar.workWeek);
    setHolidays(calendar.holidays);
    setHolidayDate(calendar.holidays[0]?.date ?? baseDate);
    setHolidayName("会社休日");
    setImportMessage("");
  }, [baseDate, calendar]);

  function toggleWeekday(weekday: number) {
    setWorkWeek((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday].toSorted((left, right) => left - right),
    );
  }

  function addHoliday() {
    if (!holidayDate) {
      return;
    }
    const normalizedName = holidayName.trim() || "会社休日";
    setHolidays((current) =>
      [
        ...current.filter((holiday) => holiday.date !== holidayDate),
        { date: holidayDate, name: normalizedName },
      ].toSorted((left, right) => left.date.localeCompare(right.date)),
    );
    setHolidayName("会社休日");
  }

  async function importJapanesePublicHolidays() {
    const parsedYear = Number(baseDate.slice(0, 4));
    const baseYear =
      Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : new Date().getFullYear();
    setImporting(true);
    setImportMessage("");
    try {
      const imported = await fetchJapanesePublicHolidays(
        `${baseYear}-01-01`,
        `${baseYear + 1}-12-31`,
      );
      const result = mergeCalendarHolidays(holidays, imported);
      setHolidays(result.holidays);
      setImportMessage(`国民の祝日 ${result.importedCount}件を取得 / ${result.addedCount}件を追加`);
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : "祝日データを取得できませんでした。",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div hidden={!active}>
      <div className="master-settings-summary">
        <div>
          <span>適用先</span>
          <strong>{team.name}</strong>
        </div>
        <div>
          <span>対象案件</span>
          <strong>{activeTeamProjectCount}件</strong>
        </div>
        <div>
          <span>休日</span>
          <strong>{sortedHolidays.length}日</strong>
        </div>
      </div>

      <div className="settings-fields">
        <label>
          カレンダー名
          <input onChange={(event) => setName(event.target.value)} value={name} />
        </label>
      </div>

      <section className="settings-card">
        <div className="settings-card-heading">
          <strong>稼働曜日</strong>
          <span>{workWeek.length}日/週</span>
        </div>
        <div className="weekday-toggle-grid" aria-label="稼働曜日">
          {weekdays.map((weekday) => (
            <button
              className={workWeek.includes(weekday.value) ? "selected" : ""}
              key={weekday.value}
              onClick={() => toggleWeekday(weekday.value)}
              type="button"
            >
              {weekday.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <strong>会社休日</strong>
          <span>{sortedHolidays.length}日</span>
        </div>
        <button
          className="subtle-action full"
          disabled={importing}
          onClick={importJapanesePublicHolidays}
          type="button"
        >
          {importing ? "祝日を取得中" : "国民の祝日を取込"}
        </button>
        {importMessage ? <p className="holiday-import-message">{importMessage}</p> : null}
        <div className="calendar-holiday-create">
          <input
            aria-label="休日"
            onChange={(event) => setHolidayDate(event.target.value)}
            onInput={(event) => setHolidayDate(event.currentTarget.value)}
            type="date"
            value={holidayDate}
          />
          <input
            aria-label="休日名"
            onChange={(event) => setHolidayName(event.target.value)}
            placeholder="休日名"
            value={holidayName}
          />
          <button
            className="subtle-action"
            disabled={!holidayDate}
            onClick={addHoliday}
            type="button"
          >
            <PlusIcon />
            追加
          </button>
        </div>
        <div className="calendar-holiday-list">
          {sortedHolidays.map((holiday) => (
            <span key={`${holiday.date}-${holiday.name}`}>
              <strong>{formatHolidayDate(holiday.date)}</strong>
              <small>{holiday.name}</small>
              <button
                aria-label={`${holiday.date} ${holiday.name} を削除`}
                onClick={() =>
                  setHolidays((current) =>
                    current.filter(
                      (item) => item.date !== holiday.date || item.name !== holiday.name,
                    ),
                  )
                }
                type="button"
              >
                <TrashIcon />
              </button>
            </span>
          ))}
        </div>
      </section>

      <div className="settings-actions">
        <button
          className="primary-button"
          disabled={workWeek.length === 0}
          onClick={() =>
            onSaveCalendar({
              ...calendar,
              holidays: sortedHolidays,
              name: name.trim() || calendar.name,
              workWeek,
            })
          }
          type="button"
        >
          カレンダーを保存
        </button>
      </div>
    </div>
  );
}
