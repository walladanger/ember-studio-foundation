import { describe, expect, test, vi } from 'vitest';
import { createMemorySettingsAdapter, createRuntimeSettingsAdapter, createSettingsService, defaultSettings } from './settingsService';
import type { SettingsPersistenceAdapter } from './settingsTypes';

describe('SettingsService', () => {
  test('falls back to safe defaults when persisted settings are invalid', async () => {
    const service = createSettingsService(createMemorySettingsAdapter('{"version":"bad","colorProfile":null}'));

    await expect(service.load()).resolves.toMatchObject({
      version: 1,
      colorProfile: { family: 'sky', shade: 400 },
      navigationCollapsed: false,
    });
  });

  test('persists the selected accent profile without changing structural settings', async () => {
    const service = createSettingsService(createMemorySettingsAdapter());
    const selected = { ...defaultSettings, colorProfile: { family: 'cyan', shade: 400 } };

    await service.save(selected);

    await expect(service.load()).resolves.toEqual(selected);
  });

  test('resets persisted preferences to defaults', async () => {
    const service = createSettingsService(createMemorySettingsAdapter());
    await service.save({ ...defaultSettings, navigationCollapsed: true });

    await expect(service.reset()).resolves.toEqual(defaultSettings);
    await expect(service.load()).resolves.toEqual(defaultSettings);
  });

  test('rejects a persisted profile that is not in the project color catalog', async () => {
    const service = createSettingsService(createMemorySettingsAdapter(JSON.stringify({
      ...defaultSettings,
      colorProfile: { family: 'not-a-palette', shade: 999 },
    })));

    await expect(service.load()).resolves.toEqual(defaultSettings);
  });

  test('returns safe persistence outcomes when the adapter fails', async () => {
    const broken: SettingsPersistenceAdapter = {
      read: async () => { throw new Error('unavailable'); },
      write: async () => { throw new Error('unavailable'); },
      clear: async () => { throw new Error('unavailable'); },
    };
    const service = createSettingsService(broken);

    await expect(service.load()).resolves.toEqual(defaultSettings);
    await expect(service.save(defaultSettings)).resolves.toEqual({ kind: 'failure', code: 'persistence-failed' });
    await expect(service.reset()).resolves.toEqual(defaultSettings);
  });

  test('selects the Tauri settings adapter only for the native runtime', async () => {
    const invoke = vi.fn().mockResolvedValue(JSON.stringify(defaultSettings));
    const browser = createRuntimeSettingsAdapter(false, invoke);
    const tauri = createRuntimeSettingsAdapter(true, invoke);

    await browser.write('browser-value');
    expect(await browser.read()).toBe('browser-value');
    expect(await tauri.read()).toBe(JSON.stringify(defaultSettings));
    expect(invoke).toHaveBeenCalledWith('load_settings');
  });
});
