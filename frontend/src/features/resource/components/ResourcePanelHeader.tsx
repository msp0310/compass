import { ChevronDownIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import type { ResourceDisplaySettings, ResourceScope } from "../../../types/schedule";

export function ResourcePanelHeader({
  displaySettings,
  onDisplaySettingsChange,
  onScopeChange,
  scope,
  scopeDescription,
  scopeLabel,
}: {
  displaySettings: ResourceDisplaySettings;
  onDisplaySettingsChange: (settings: ResourceDisplaySettings) => void;
  onScopeChange: (scope: ResourceScope) => void;
  scope: ResourceScope;
  scopeDescription: string;
  scopeLabel: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { compact, showHours, showPercent, warningThreshold } = displaySettings;
  const visibleMetricLabel = [showHours ? "時間" : null, showPercent ? "率" : null]
    .filter(Boolean)
    .join(" / ");
  const updateDisplaySettings = (patch: Partial<ResourceDisplaySettings>) =>
    onDisplaySettingsChange({ ...displaySettings, ...patch });

  return (
    <>
      <div className="resource-header">
        <div>
          <h2>チームの作業量（週次）</h2>
          <span>
            {scopeDescription}・表示：
            {visibleMetricLabel || "バーのみ"}
          </span>
        </div>
        <div className="resource-header-actions">
          <div className="resource-scope-toggle" aria-label="表示範囲">
            <button
              aria-pressed={scope === "project"}
              className={scope === "project" ? "active" : ""}
              onClick={() => onScopeChange("project")}
              type="button"
            >
              このプロジェクト
            </button>
            <button
              aria-pressed={scope === "team"}
              className={scope === "team" ? "active" : ""}
              onClick={() => onScopeChange("team")}
              type="button"
            >
              チーム横断
            </button>
          </div>
          <div className="resource-settings-wrap">
            <button
              aria-expanded={settingsOpen}
              className={settingsOpen ? "subtle-action active" : "subtle-action"}
              onClick={() => setSettingsOpen((open) => !open)}
              type="button"
            >
              <Cog6ToothIcon />
              表示設定
              <ChevronDownIcon />
            </button>
            {settingsOpen ? (
              <div className="resource-settings-popover">
                <strong>表示設定</strong>
                <label className="check-row">
                  <input
                    checked={showHours}
                    onChange={(event) => updateDisplaySettings({ showHours: event.target.checked })}
                    type="checkbox"
                  />
                  工数を表示
                </label>
                <label className="check-row">
                  <input
                    checked={showPercent}
                    onChange={(event) =>
                      updateDisplaySettings({ showPercent: event.target.checked })
                    }
                    type="checkbox"
                  />
                  稼働率を表示
                </label>
                <label className="check-row">
                  <input
                    checked={compact}
                    onChange={(event) => updateDisplaySettings({ compact: event.target.checked })}
                    type="checkbox"
                  />
                  コンパクト表示
                </label>
                <label className="threshold-control">
                  警告しきい値
                  <input
                    max="120"
                    min="50"
                    onChange={(event) =>
                      updateDisplaySettings({ warningThreshold: Number(event.target.value) })
                    }
                    type="range"
                    value={warningThreshold}
                  />
                  <span>{warningThreshold}%</span>
                </label>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="resource-scope-note">
        <strong>{scopeLabel}</strong>
        <span>{scopeDescription}</span>
      </div>
    </>
  );
}
