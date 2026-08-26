import { useCallback, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { useOptionalSettings } from '../settings/settingsStore';
import type { PersistenceAdapter } from '../services/contracts';
import type { WindowBounds } from './windowTypes';

export interface PersistedNativeWindowState { version: 1; bounds?: WindowBounds; maximized: boolean; }
export type WindowStatePersistenceAdapter = PersistenceAdapter<string>;

function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function isBounds(value: unknown): value is WindowBounds {
  if (!value || typeof value !== 'object') return false;
  const bounds = value as Partial<WindowBounds>;
  return isFiniteNumber(bounds.x) && isFiniteNumber(bounds.y) && isFiniteNumber(bounds.width) && bounds.width > 0 && isFiniteNumber(bounds.height) && bounds.height > 0;
}

export function validateWindowState(value: unknown): PersistedNativeWindowState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Partial<PersistedNativeWindowState>;
  if (state.version !== 1 || typeof state.maximized !== 'boolean' || (state.bounds !== undefined && !isBounds(state.bounds))) return null;
  return { version: 1, ...(state.bounds ? { bounds: state.bounds } : {}), maximized: state.maximized };
}
export function serializeWindowState(state: Omit<PersistedNativeWindowState, 'version'>): string {
  const validated = validateWindowState({ version: 1, ...state });
  if (!validated) throw new Error('Cannot serialize an invalid native window state.');
  return JSON.stringify(validated);
}
export function deserializeWindowState(raw: string | null): PersistedNativeWindowState | null {
  if (!raw) return null;
  try { return validateWindowState(JSON.parse(raw)); } catch { return null; }
}
export function createMemoryWindowStateAdapter(initialValue: string | null = null): WindowStatePersistenceAdapter & { value(): string | null } {
  let stored = initialValue;
  return { async read() { return stored; }, async write(value) { stored = value; }, async clear() { stored = null; }, value() { return stored; } };
}
export interface WindowStateService { load(): Promise<PersistedNativeWindowState | null>; save(state: Omit<PersistedNativeWindowState, 'version'>): Promise<void>; clear(): Promise<void>; }
export function createWindowStateService(adapter: WindowStatePersistenceAdapter): WindowStateService {
  return { async load() { return deserializeWindowState(await adapter.read()); }, async save(state) { await adapter.write(serializeWindowState(state)); }, clear: () => adapter.clear() };
}

/** Settings hook boundary; monitor coordinates may be negative and are never screen-clamped here. */
export function useWindowStateSettings(windowId: string) {
  const settings = useOptionalSettings();
  const load = useCallback((): PersistedNativeWindowState | null => {
    const values = settings?.settings.extensionSettings.nativeWindowStates;
    if (!values || typeof values !== 'object' || Array.isArray(values)) return null;
    return validateWindowState((values as Record<string, unknown>)[windowId]);
  }, [settings?.settings.extensionSettings, windowId]);
  const save = useCallback(async (state: Omit<PersistedNativeWindowState, 'version'>) => {
    if (!settings) return;
    const serialized = serializeWindowState(state);
    const validated = deserializeWindowState(serialized);
    if (!validated) throw new Error('Cannot persist an invalid native window state.');
    const existing = settings.settings.extensionSettings.nativeWindowStates;
    const states = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing as Record<string, unknown> : {};
    await settings.update({ extensionSettings: { ...settings.settings.extensionSettings, nativeWindowStates: { ...states, [windowId]: validated } } });
  }, [settings, windowId]);
  return { load, save };
}

export interface NativeWindowStateBridge {
  capture(): Promise<Omit<PersistedNativeWindowState, 'version'> | null>;
  restore(state: PersistedNativeWindowState | null): Promise<void>;
}

export interface NativeWindowStateSource {
  read(): Promise<Omit<PersistedNativeWindowState, 'version'>>;
  apply(state: PersistedNativeWindowState): Promise<void>;
}

export function createNativeWindowStateBridge(source: NativeWindowStateSource): NativeWindowStateBridge {
  let lastNormalBounds: WindowBounds | undefined;
  return {
    async capture() {
      const snapshot = await source.read();
      if (!snapshot.maximized && snapshot.bounds) lastNormalBounds = snapshot.bounds;
      return { ...(lastNormalBounds ? { bounds: lastNormalBounds } : snapshot.bounds ? { bounds: snapshot.bounds } : {}), maximized: snapshot.maximized };
    },
    async restore(state) {
      if (state?.bounds) lastNormalBounds = state.bounds;
      if (state) await source.apply(state);
    },
  };
}

export function createBrowserWindowStateBridge(): NativeWindowStateBridge {
  return { async capture() { return null; }, async restore() { /* Browser preview has no native bounds. */ } };
}

export function createTauriWindowStateBridge(): NativeWindowStateBridge {
  const nativeWindow = getCurrentWindow();
  return createNativeWindowStateBridge({
    async read() {
      const [scaleFactor, position, size, maximized] = await Promise.all([nativeWindow.scaleFactor(), nativeWindow.innerPosition(), nativeWindow.innerSize(), nativeWindow.isMaximized()]);
      const logicalPosition = position.toLogical(scaleFactor);
      const logicalSize = size.toLogical(scaleFactor);
      return { bounds: { x: logicalPosition.x, y: logicalPosition.y, width: logicalSize.width, height: logicalSize.height }, maximized };
    },
    async apply(state) {
      if (state.bounds) {
        await nativeWindow.setPosition(new LogicalPosition(state.bounds.x, state.bounds.y));
        await nativeWindow.setSize(new LogicalSize(state.bounds.width, state.bounds.height));
      }
      if (state.maximized) await nativeWindow.maximize();
      else if (await nativeWindow.isMaximized()) await nativeWindow.unmaximize();
    },
  });
}

function getNativeWindowStateBridge(): NativeWindowStateBridge {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? createTauriWindowStateBridge() : createBrowserWindowStateBridge();
}

/** Captures state at page teardown and restores it when a native host starts. */
export function useNativeWindowStateLifecycle(windowId: string, bridge?: NativeWindowStateBridge): void {
  const { load, save } = useWindowStateSettings(windowId);
  const bridgeRef = useRef<NativeWindowStateBridge | null>(null);
  if (!bridgeRef.current) bridgeRef.current = bridge ?? getNativeWindowStateBridge();
  const nativeBridge = bridgeRef.current;
  useEffect(() => {
    void nativeBridge.restore(load()).catch(() => undefined);
    const persist = () => {
      void nativeBridge.capture().then((state) => state ? save(state) : undefined).catch(() => undefined);
    };
    window.addEventListener('pagehide', persist);
    return () => { window.removeEventListener('pagehide', persist); persist(); };
  }, [load, nativeBridge, save]);
}
