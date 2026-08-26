import type { AppSettings, SettingsPersistenceAdapter, SettingsService } from './settingsTypes';
import { getColorFamilies, getColorShades } from '../design-system/colorProfiles';
import { invoke } from '@tauri-apps/api/core';

export const defaultSettings: AppSettings = {
  version: 1,
  colorProfile: { family: 'sky', shade: 400 },
  navigationCollapsed: false,
  recentFiles: [],
  windowBehavior: { restoreOnLaunch: true, rememberBounds: true },
  extensionSettings: {},
};

function isColorProfile(value: unknown): value is AppSettings['colorProfile'] {
  if (!value || typeof value !== 'object') return false;
  const { family, shade } = value as { family?: unknown; shade?: unknown };
  return typeof family === 'string'
    && typeof shade === 'number'
    && getColorFamilies().includes(family)
    && getColorShades(family).includes(shade);
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<AppSettings>;
  return settings.version === 1
    && isColorProfile(settings.colorProfile)
    && typeof settings.navigationCollapsed === 'boolean'
    && Array.isArray(settings.recentFiles) && settings.recentFiles.every((path) => typeof path === 'string')
    && !!settings.windowBehavior
    && typeof settings.windowBehavior.restoreOnLaunch === 'boolean'
    && typeof settings.windowBehavior.rememberBounds === 'boolean'
    && !!settings.extensionSettings
    && typeof settings.extensionSettings === 'object' && !Array.isArray(settings.extensionSettings);
}

export function createSettingsService(
  adapter: SettingsPersistenceAdapter,
  defaults: AppSettings = defaultSettings,
): SettingsService<AppSettings> {
  return {
    async load() {
      try {
        const raw = await adapter.read();
        if (!raw) return defaults;
        const parsed: unknown = JSON.parse(raw);
        return isAppSettings(parsed) ? parsed : defaults;
      } catch {
        return defaults;
      }
    },
    async save(settings) {
      try {
        await adapter.write(JSON.stringify(settings));
        return { kind: 'success' } as const;
      } catch {
        return { kind: 'failure', code: 'persistence-failed' } as const;
      }
    },
    async reset() {
      try { await adapter.clear(); } catch { /* defaults remain usable when persistence is unavailable */ }
      return defaults;
    },
  };
}

export function createMemorySettingsAdapter(initialValue: string | null = null): SettingsPersistenceAdapter & { value(): string | null } {
  let stored = initialValue;
  return {
    async read() { return stored; },
    async write(value) { stored = value; },
    async clear() { stored = null; },
    value() { return stored; },
  };
}

export type NativeSettingsInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export function createTauriSettingsAdapter(command: NativeSettingsInvoke = invoke): SettingsPersistenceAdapter {
  return {
    read: () => command<string | null>('load_settings'),
    write: (content) => command<void>('save_settings', { content }),
    clear: () => command<void>('clear_settings'),
  };
}

export function createRuntimeSettingsAdapter(isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window, command: NativeSettingsInvoke = invoke): SettingsPersistenceAdapter {
  return isTauri ? createTauriSettingsAdapter(command) : createMemorySettingsAdapter();
}
