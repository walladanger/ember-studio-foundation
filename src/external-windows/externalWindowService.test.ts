import { vi } from 'vitest';
import { createExternalWindowService, isExternalFeatureWindowLabel } from './externalWindowService';

const feature = {
  id: 'data-explorer',
  title: 'Data Explorer',
  presentation: 'dual' as const,
  initialBounds: { x: 80, y: 56, width: 720, height: 480 },
  minimum: { width: 360, height: 240 },
};

test('opening a duplicate external feature focuses the existing native window', async () => {
  const create = vi.fn().mockResolvedValue(undefined);
  const focus = vi.fn().mockResolvedValue(undefined);
  const service = createExternalWindowService({ create, focus, close: vi.fn(), onClosed: () => () => undefined });

  const first = await service.openFeature(feature);
  const second = await service.openFeature(feature);

  expect(first).toMatchObject({ featureId: 'data-explorer', label: 'ember-feature-data-explorer', status: 'open' });
  expect(second.status).toBe('focused');
  expect(create).toHaveBeenCalledTimes(1);
  expect(focus).toHaveBeenCalledWith('ember-feature-data-explorer');
});

test('sends only the validated native external-window request fields', async () => {
  const create = vi.fn().mockResolvedValue({ created: true });
  const service = createExternalWindowService({ create, focus: vi.fn(), close: vi.fn(), onClosed: () => () => undefined });

  await service.openFeature(feature);

  expect(create).toHaveBeenCalledWith({
    featureId: 'data-explorer',
    label: 'ember-feature-data-explorer',
    title: 'Data Explorer',
    width: 720,
    height: 480,
    minWidth: 360,
    minHeight: 240,
  });
});

test('closing an external feature clears its open indicator for a later reopen', async () => {
  const create = vi.fn().mockResolvedValue(undefined);
  const service = createExternalWindowService({ create, focus: vi.fn(), close: vi.fn().mockResolvedValue(undefined), onClosed: () => () => undefined });

  await service.openFeature(feature);
  await service.closeFeature(feature);
  await service.openFeature(feature);

  expect(create).toHaveBeenCalledTimes(2);
  expect(service.getState('data-explorer')).toEqual({ internal: false, external: true, mode: 'dual' });
});

test('clears a tracked feature when the native window reports that it was closed', async () => {
  let notifyClosed: ((label: string) => void) | undefined;
  const service = createExternalWindowService({
    create: vi.fn().mockResolvedValue({ created: true }),
    focus: vi.fn(),
    close: vi.fn(),
    onClosed(listener) { notifyClosed = listener; return () => undefined; },
  });

  await service.openFeature(feature);
  notifyClosed?.('ember-feature-data-explorer');

  await vi.waitFor(() => expect(service.getState('data-explorer')).toMatchObject({ external: false, mode: 'dual' }));
});

test('recreates a stale tracked feature when native focus reports it no longer exists', async () => {
  const create = vi.fn().mockResolvedValue({ created: true });
  const focus = vi.fn().mockRejectedValue(new Error('window-not-found'));
  const service = createExternalWindowService({ create, focus, close: vi.fn(), onClosed: () => () => undefined });

  await service.openFeature(feature);
  const reopened = await service.openFeature(feature);

  expect(reopened.status).toBe('open');
  expect(create).toHaveBeenCalledTimes(2);
  expect(service.getState('data-explorer')).toMatchObject({ external: true });
});

test('recreates a stale tracked feature when Tauri returns a serialized not-found error', async () => {
  const create = vi.fn().mockResolvedValue({ created: true });
  const focus = vi.fn().mockRejectedValue({ code: 'window-not-found', message: 'The requested external window does not exist.' });
  const service = createExternalWindowService({ create, focus, close: vi.fn(), onClosed: () => () => undefined });

  await service.openFeature(feature);
  const reopened = await service.openFeature(feature);

  expect(reopened.status).toBe('open');
  expect(create).toHaveBeenCalledTimes(2);
});

test('serializes concurrent opens and an overlapping close for the same feature', async () => {
  const resolveCreates: Array<(value: { created: true }) => void> = [];
  const create = vi.fn(() => new Promise<{ created: true }>((resolve) => { resolveCreates.push(resolve); }));
  const close = vi.fn().mockResolvedValue(undefined);
  const service = createExternalWindowService({ create, focus: vi.fn(), close, onClosed: () => () => undefined });

  const firstOpen = service.openFeature(feature);
  const secondOpen = service.openFeature(feature);
  const closeWhileOpening = service.closeFeature(feature);
  await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  resolveCreates.forEach((resolve) => resolve({ created: true }));
  await Promise.all([firstOpen, secondOpen, closeWhileOpening]);

  expect(create).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledWith('ember-feature-data-explorer');
  expect(service.getState('data-explorer')).toMatchObject({ external: false });
});

test('recognizes only stable feature-window labels as externally controllable', () => {
  expect(isExternalFeatureWindowLabel('ember-feature-data-explorer')).toBe(true);
  expect(isExternalFeatureWindowLabel('main')).toBe(false);
  expect(isExternalFeatureWindowLabel('ember-feature-../settings')).toBe(false);
});
