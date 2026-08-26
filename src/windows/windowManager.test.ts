import { bringToFront, clampBounds } from './windowGeometry';
import { createWindowManagerState, windowManagerReducer } from './windowManager';

const workspace = { width: 1200, height: 700 };
const minimum = { width: 360, height: 240 };

test('clamps a moved window so its header remains reachable', () => {
  const result = clampBounds(
    { x: -600, y: -500, width: 720, height: 480 },
    workspace,
    minimum,
  );

  expect(result.x).toBeGreaterThanOrEqual(-result.width + 96);
  expect(result.y).toBeGreaterThanOrEqual(0);
  expect(result.width).toBeGreaterThanOrEqual(360);
  expect(result.height).toBeGreaterThanOrEqual(240);
});

test('focus moves the selected window to the highest z-index', () => {
  const result = bringToFront([{ id: 'a', zIndex: 1 }, { id: 'b', zIndex: 2 }], 'a');

  expect(result.find((window) => window.id === 'a')?.zIndex).toBe(3);
});

test('pointer move and resize updates retain the z-index established at drag start', () => {
  const first = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: { id: 'a', title: 'A', bounds: { x: 40, y: 40, width: 400, height: 300 }, minimum },
  });
  const second = windowManagerReducer(first, {
    type: 'open',
    descriptor: { id: 'b', title: 'B', bounds: { x: 80, y: 80, width: 400, height: 300 }, minimum },
  });
  const focused = windowManagerReducer(second, { type: 'focus', id: 'a' });
  const moved = windowManagerReducer(focused, {
    type: 'move',
    id: 'a',
    bounds: { x: 100, y: 120, width: 400, height: 300 },
  });
  const resized = windowManagerReducer(moved, {
    type: 'resize',
    id: 'a',
    edge: 'east',
    bounds: { x: 100, y: 120, width: 440, height: 300 },
  });

  expect(focused.windows.find((window) => window.id === 'a')?.zIndex).toBe(3);
  expect(resized.windows.find((window) => window.id === 'a')?.zIndex).toBe(3);
  expect(resized.activeId).toBe('a');
  expect(resized.windows.find((window) => window.id === 'a')?.bounds).toEqual({ x: 100, y: 120, width: 440, height: 300 });
});

test('ignores a workspace update when dimensions have not changed', () => {
  const state = createWindowManagerState(workspace);

  expect(windowManagerReducer(state, { type: 'setWorkspace', workspace })).toBe(state);
});

test('opens a window once and closes it by id', () => {
  const opened = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const repeatedOpen = windowManagerReducer(opened, {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const closed = windowManagerReducer(repeatedOpen, { type: 'close', id: 'data-explorer' });

  expect(repeatedOpen.windows).toHaveLength(1);
  expect(repeatedOpen.activeId).toBe('data-explorer');
  expect(closed.windows).toEqual([]);
  expect(closed.activeId).toBeNull();
});

test('minimize and restore retain a window normal bounds and active state', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const minimized = windowManagerReducer(state, { type: 'minimize', id: 'data-explorer' });
  const restored = windowManagerReducer(minimized, { type: 'restore', id: 'data-explorer' });

  expect(minimized.windows[0]).toMatchObject({ state: 'minimized', bounds: { x: 80, y: 60, width: 720, height: 480 } });
  expect(minimized.activeId).toBeNull();
  expect(restored.windows[0]).toMatchObject({ state: 'normal', bounds: { x: 80, y: 60, width: 720, height: 480 } });
  expect(restored.activeId).toBe('data-explorer');
});

test('maximizing and restoring returns to the saved normal bounds', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const maximized = windowManagerReducer(state, { type: 'toggleMaximize', id: 'data-explorer' });
  const restored = windowManagerReducer(maximized, { type: 'toggleMaximize', id: 'data-explorer' });

  expect(maximized.windows[0]).toMatchObject({ state: 'maximized', bounds: { x: 0, y: 0, width: 1200, height: 700 }, normalBounds: { x: 80, y: 60, width: 720, height: 480 } });
  expect(restored.windows[0]).toMatchObject({ state: 'normal', bounds: { x: 80, y: 60, width: 720, height: 480 } });
});

test('ignores maximize toggles for minimized windows without overwriting normal bounds', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const maximized = windowManagerReducer(state, { type: 'toggleMaximize', id: 'data-explorer' });
  const minimized = windowManagerReducer(maximized, { type: 'minimize', id: 'data-explorer' });
  const toggled = windowManagerReducer(minimized, { type: 'toggleMaximize', id: 'data-explorer' });

  expect(toggled).toBe(minimized);
  expect(toggled.windows[0]).toMatchObject({
    state: 'minimized',
    normalBounds: { x: 80, y: 60, width: 720, height: 480 },
  });
});

test('move and resize clamp bounds while preserving serialized window state', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const moved = windowManagerReducer(state, { type: 'move', id: 'data-explorer', bounds: { x: -1000, y: -1000, width: 720, height: 480 } });
  const resized = windowManagerReducer(moved, { type: 'resize', id: 'data-explorer', bounds: { x: -1000, y: -1000, width: 20, height: 20 } });

  expect(resized.windows[0]).toMatchObject({ bounds: { x: -264, y: 0, width: 360, height: 240 } });
  expect(JSON.parse(JSON.stringify(resized))).toMatchObject({ windows: [{ id: 'data-explorer' }] });
});

test('west and north resize at minimum dimensions keep the opposite edges anchored', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 400, height: 280 },
      minimum,
    },
  });
  const westResized = windowManagerReducer(state, {
    type: 'resize',
    id: 'data-explorer',
    edge: 'west',
    bounds: { x: 280, y: 60, width: 200, height: 280 },
  });
  const northResized = windowManagerReducer(westResized, {
    type: 'resize',
    id: 'data-explorer',
    edge: 'north',
    bounds: { x: 120, y: 160, width: 360, height: 180 },
  });

  expect(westResized.windows[0]?.bounds).toEqual({ x: 120, y: 60, width: 360, height: 280 });
  expect(northResized.windows[0]?.bounds).toEqual({ x: 120, y: 100, width: 360, height: 240 });
});

test('restoring a minimized maximized window returns to its saved normal bounds', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 80, y: 60, width: 720, height: 480 },
      minimum,
    },
  });
  const maximized = windowManagerReducer(state, { type: 'toggleMaximize', id: 'data-explorer' });
  const minimized = windowManagerReducer(maximized, { type: 'minimize', id: 'data-explorer' });
  const restored = windowManagerReducer(minimized, { type: 'restore', id: 'data-explorer' });
  const maximizedAgain = windowManagerReducer(restored, { type: 'toggleMaximize', id: 'data-explorer' });
  const restoredAgain = windowManagerReducer(maximizedAgain, { type: 'toggleMaximize', id: 'data-explorer' });

  expect(restored.windows[0]).toMatchObject({ state: 'normal', bounds: { x: 80, y: 60, width: 720, height: 480 }, normalBounds: undefined });
  expect(restoredAgain.windows[0]).toMatchObject({ state: 'normal', bounds: { x: 80, y: 60, width: 720, height: 480 }, normalBounds: undefined });
});

test('opening a minimized maximized window restores its saved normal bounds', () => {
  const descriptor = {
    id: 'data-explorer',
    title: 'Data Explorer',
    bounds: { x: 80, y: 60, width: 720, height: 480 },
    minimum,
  };
  const opened = windowManagerReducer(createWindowManagerState(workspace), { type: 'open', descriptor });
  const maximized = windowManagerReducer(opened, { type: 'toggleMaximize', id: 'data-explorer' });
  const minimized = windowManagerReducer(maximized, { type: 'minimize', id: 'data-explorer' });
  const reopened = windowManagerReducer(minimized, { type: 'open', descriptor });

  expect(reopened.windows[0]).toMatchObject({
    state: 'normal',
    bounds: { x: 80, y: 60, width: 720, height: 480 },
    normalBounds: undefined,
  });
});

test('reclamps saved normal bounds when a maximized workspace shrinks', () => {
  const state = windowManagerReducer(createWindowManagerState(workspace), {
    type: 'open',
    descriptor: {
      id: 'data-explorer',
      title: 'Data Explorer',
      bounds: { x: 900, y: 500, width: 720, height: 480 },
      minimum,
    },
  });
  const maximized = windowManagerReducer(state, { type: 'toggleMaximize', id: 'data-explorer' });
  const shrunk = windowManagerReducer(maximized, { type: 'setWorkspace', workspace: { width: 600, height: 400 } });
  const restored = windowManagerReducer(shrunk, { type: 'toggleMaximize', id: 'data-explorer' });

  expect(restored.windows[0]).toMatchObject({
    state: 'normal',
    bounds: { x: 504, y: 362, width: 600, height: 400 },
  });
});
