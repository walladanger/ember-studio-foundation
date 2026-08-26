import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { ExternalFeatureDescriptor, ExternalWindowOperationResult, ExternalWindowPort, ExternalWindowRequest, ExternalWindowState, FeaturePresentationState } from './externalWindowTypes';

const EXTERNAL_WINDOW_CLOSED_EVENT = 'ember://external-window-closed';

export function featureWindowLabel(featureId: string): string { return `ember-feature-${featureId}`; }
export function featureWindowUrl(featureId: string): string { return `/?window=external&feature=${encodeURIComponent(featureId)}`; }
export function isExternalFeatureWindowLabel(label: string): boolean {
  return /^ember-feature-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(label);
}

export function createBrowserExternalWindowPort(): ExternalWindowPort {
  return {
    async create() { return { created: true }; },
    async focus() { /* Browser preview has no native window to focus. */ },
    async close() { /* Browser preview has no native window to close. */ },
    onClosed() { return () => undefined; },
  };
}

export function createTauriExternalWindowPort(): ExternalWindowPort {
  return {
    create: (request) => invoke<ExternalWindowOperationResult>('open_external_feature_window', { request }),
    focus: (label) => invoke<void>('focus_external_feature_window', { label }),
    close: (label) => invoke<void>('close_external_feature_window', { label }),
    onClosed(listener) {
      let active = true;
      let unlisten: (() => void) | undefined;
      void listen<string>(EXTERNAL_WINDOW_CLOSED_EVENT, (event) => { if (active) listener(event.payload); })
        .then((cleanup) => { unlisten = cleanup; if (!active) cleanup(); });
      return () => { active = false; unlisten?.(); };
    },
  };
}

function isTauriRuntime(): boolean { return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window; }
export function getExternalWindowPort(): ExternalWindowPort { return isTauriRuntime() ? createTauriExternalWindowPort() : createBrowserExternalWindowPort(); }

export interface ExternalWindowService {
  openFeature(feature: ExternalFeatureDescriptor): Promise<ExternalWindowState>;
  focusFeature(feature: ExternalFeatureDescriptor): Promise<void>;
  closeFeature(feature: ExternalFeatureDescriptor): Promise<ExternalWindowState>;
  getState(featureId: string, mode?: FeaturePresentationState['mode']): FeaturePresentationState;
  subscribe(listener: (featureId: string) => void): () => void;
}

function isWindowNotFound(error: unknown): boolean {
  if (error instanceof Error) return /window-not-found|does not exist/i.test(error.message);
  return !!error && typeof error === 'object' && (error as { code?: unknown }).code === 'window-not-found';
}

export function createExternalWindowService(port: ExternalWindowPort = getExternalWindowPort()): ExternalWindowService {
  const openFeatureIds = new Set<string>();
  const presentationModes = new Map<string, FeaturePresentationState['mode']>();
  const subscribers = new Set<(featureId: string) => void>();
  const queues = new Map<string, Promise<void>>();
  const requestFor = (feature: ExternalFeatureDescriptor): ExternalWindowRequest => ({ featureId: feature.id, label: featureWindowLabel(feature.id), title: feature.title, width: feature.initialBounds.width, height: feature.initialBounds.height, minWidth: feature.minimum.width, minHeight: feature.minimum.height });
  const ensureExternal = (feature: ExternalFeatureDescriptor) => {
    if (feature.presentation === 'internal') throw new Error(`Feature ${feature.id} cannot open in an external window.`);
  };
  const publish = (featureId: string) => subscribers.forEach((listener) => listener(featureId));
  const markClosed = (featureId: string) => {
    if (openFeatureIds.delete(featureId)) publish(featureId);
  };
  const enqueue = <T,>(featureId: string, operation: () => Promise<T>): Promise<T> => {
    const previous = queues.get(featureId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(operation);
    queues.set(featureId, result.then(() => undefined, () => undefined));
    return result;
  };
  const featureIdForLabel = (label: string) => [...presentationModes.keys()].find((featureId) => featureWindowLabel(featureId) === label);

  port.onClosed((label) => {
    const featureId = featureIdForLabel(label);
    if (featureId) void enqueue(featureId, async () => { markClosed(featureId); });
  });

  return {
    openFeature(feature) {
      ensureExternal(feature);
      presentationModes.set(feature.id, feature.presentation);
      return enqueue(feature.id, async () => {
        const request = requestFor(feature);
        if (openFeatureIds.has(feature.id)) {
          try {
            await port.focus(request.label);
            return { featureId: feature.id, label: request.label, status: 'focused' };
          } catch (error) {
            if (!isWindowNotFound(error)) throw error;
            markClosed(feature.id);
          }
        }
        const result = await port.create(request);
        openFeatureIds.add(feature.id);
        publish(feature.id);
        return { featureId: feature.id, label: request.label, status: result?.created === false ? 'focused' : 'open' };
      });
    },
    focusFeature(feature) {
      ensureExternal(feature);
      presentationModes.set(feature.id, feature.presentation);
      return enqueue(feature.id, async () => {
        try { await port.focus(featureWindowLabel(feature.id)); openFeatureIds.add(feature.id); }
        catch (error) { if (isWindowNotFound(error)) markClosed(feature.id); else throw error; }
      });
    },
    closeFeature(feature) {
      ensureExternal(feature);
      return enqueue(feature.id, async () => {
        const label = featureWindowLabel(feature.id);
        try { await port.close(label); } catch (error) { if (!isWindowNotFound(error)) throw error; }
        markClosed(feature.id);
        return { featureId: feature.id, label, status: 'closed' };
      });
    },
    getState(featureId, mode = presentationModes.get(featureId) ?? 'external') { return { mode, internal: false, external: openFeatureIds.has(featureId) }; },
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
  };
}
