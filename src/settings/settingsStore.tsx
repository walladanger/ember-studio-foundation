import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { createRuntimeSettingsAdapter, createSettingsService, defaultSettings } from './settingsService';
import type { AppSettings, SettingsPersistenceResult, SettingsService } from './settingsTypes';

export interface SettingsStore<T extends object> {
  get(): T;
  subscribe(listener: () => void): () => void;
  update(patch: Partial<T>): Promise<T>;
  replace(next: T): Promise<T>;
}

export function createSettingsStore<T extends object>(initial: T, save: (value: T) => Promise<void>): SettingsStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const replace = async (next: T) => {
    value = next;
    publish();
    await save(next);
    return next;
  };
  return {
    get: () => value,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch) { return replace({ ...value, ...patch }); },
    replace,
  };
}

export interface SettingsContextValue {
  settings: AppSettings;
  persistence: SettingsPersistenceResult;
  update(patch: Partial<AppSettings>): Promise<AppSettings>;
  replace(settings: AppSettings): Promise<AppSettings>;
  setRecentFiles(recentFiles: readonly string[]): Promise<AppSettings>;
  addRecentFile(path: string): Promise<AppSettings>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const defaultSettingsService = createSettingsService(createRuntimeSettingsAdapter());

export interface SettingsProviderProps extends PropsWithChildren {
  service?: SettingsService<AppSettings>;
  initialSettings?: AppSettings;
  onRecentFilesChange?: (recentFiles: readonly string[]) => void;
}

export function SettingsProvider({
  children,
  service = defaultSettingsService,
  initialSettings,
  onRecentFilesChange,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState(initialSettings ?? defaultSettings);
  const [persistence, setPersistence] = useState<SettingsPersistenceResult>({ kind: 'success' });
  useEffect(() => {
    if (initialSettings) return;
    let active = true;
    void service.load().then((persisted) => { if (active) setSettings(persisted); }).catch(() => {
      if (active) { setSettings(defaultSettings); setPersistence({ kind: 'failure', code: 'persistence-failed' }); }
    });
    return () => { active = false; };
  }, [initialSettings, service]);
  useEffect(() => { onRecentFilesChange?.(settings.recentFiles); }, [onRecentFilesChange, settings.recentFiles]);
  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    persistence,
    async update(patch) {
      const next = { ...settings, ...patch };
      setSettings(next);
      try { setPersistence(await service.save(next)); } catch { setPersistence({ kind: 'failure', code: 'persistence-failed' }); }
      return next;
    },
    async replace(next) {
      setSettings(next);
      try { setPersistence(await service.save(next)); } catch { setPersistence({ kind: 'failure', code: 'persistence-failed' }); }
      return next;
    },
    async setRecentFiles(recentFiles) {
      const next = { ...settings, recentFiles: [...recentFiles] };
      setSettings(next);
      try { setPersistence(await service.save(next)); } catch { setPersistence({ kind: 'failure', code: 'persistence-failed' }); }
      return next;
    },
    async addRecentFile(path) {
      const recentFiles = [path, ...settings.recentFiles.filter((recent) => recent !== path)].slice(0, 10);
      const next = { ...settings, recentFiles };
      setSettings(next);
      try { setPersistence(await service.save(next)); } catch { setPersistence({ kind: 'failure', code: 'persistence-failed' }); }
      return next;
    },
  }), [persistence, service, settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider.');
  return context;
}

export function useOptionalSettings(): SettingsContextValue | null {
  return useContext(SettingsContext);
}
