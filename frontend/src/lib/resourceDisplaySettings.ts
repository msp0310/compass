import type { ResourceDisplaySettings } from "../types/schedule";

export const defaultResourceDisplaySettings: ResourceDisplaySettings = {
  compact: false,
  showHours: true,
  showPercent: true,
  warningThreshold: 90,
};

/** normalizeResourceDisplaySettingsを実行し、アプリケーション用の値を返します。 */
export function normalizeResourceDisplaySettings(
  value: unknown,
): ResourceDisplaySettings {
  if (value == null || typeof value !== "object") {
    return defaultResourceDisplaySettings;
  }

  const maybe = value as Partial<ResourceDisplaySettings>;
  return {
    compact:
      typeof maybe.compact === "boolean"
        ? maybe.compact
        : defaultResourceDisplaySettings.compact,
    showHours:
      typeof maybe.showHours === "boolean"
        ? maybe.showHours
        : defaultResourceDisplaySettings.showHours,
    showPercent:
      typeof maybe.showPercent === "boolean"
        ? maybe.showPercent
        : defaultResourceDisplaySettings.showPercent,
    warningThreshold: normalizeWarningThreshold(maybe.warningThreshold),
  };
}

function normalizeWarningThreshold(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultResourceDisplaySettings.warningThreshold;
  }
  return Math.min(120, Math.max(50, Math.round(value)));
}
