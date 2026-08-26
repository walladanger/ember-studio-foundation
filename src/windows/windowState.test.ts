import { createMemoryWindowStateAdapter, createNativeWindowStateBridge, deserializeWindowState, serializeWindowState } from './windowState';

test('serializes valid last bounds and maximized state using a versioned payload', async () => {
  const serialized = serializeWindowState({ bounds: { x: -1200, y: 80, width: 1200, height: 800 }, maximized: true });
  const adapter = createMemoryWindowStateAdapter();
  await adapter.write(serialized);

  expect(deserializeWindowState(await adapter.read())).toEqual({
    version: 1,
    bounds: { x: -1200, y: 80, width: 1200, height: 800 },
    maximized: true,
  });
});

test('rejects invalid, non-finite, and unsafe window-state payloads', () => {
  expect(deserializeWindowState('{"version":1,"bounds":{"x":0,"y":0,"width":0,"height":400},"maximized":false}')).toBeNull();
  expect(deserializeWindowState('{"version":1,"bounds":{"x":0,"y":0,"width":400,"height":"NaN"},"maximized":false}')).toBeNull();
  expect(deserializeWindowState('{"version":2,"maximized":false}')).toBeNull();
});

test('rejects invalid state before saving it through the persistence service', () => {
  expect(() => serializeWindowState({ bounds: { x: 0, y: 0, width: 0, height: 400 }, maximized: false })).toThrow('invalid native window state');
});

test('preserves the last normal bounds while the native window is maximized', async () => {
  let snapshot = { bounds: { x: -720, y: 50, width: 900, height: 640 }, maximized: false };
  const bridge = createNativeWindowStateBridge({
    read: async () => snapshot,
    apply: async () => undefined,
  });

  await bridge.capture();
  snapshot = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, maximized: true };

  await expect(bridge.capture()).resolves.toEqual({ bounds: { x: -720, y: 50, width: 900, height: 640 }, maximized: true });
});

test('seeds last normal bounds from restored maximized state', async () => {
  let snapshot = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, maximized: true };
  const bridge = createNativeWindowStateBridge({ read: async () => snapshot, apply: async () => undefined });

  await bridge.restore({ version: 1, bounds: { x: -1000, y: 80, width: 1000, height: 700 }, maximized: true });

  await expect(bridge.capture()).resolves.toEqual({ bounds: { x: -1000, y: 80, width: 1000, height: 700 }, maximized: true });
});
