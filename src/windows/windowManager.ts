import { bringToFront, clampBounds, clampResizeBounds } from './windowGeometry';
import type { WindowDescriptor, WindowDimensions, WindowManagerAction, WindowManagerState } from './windowTypes';

export function createWindowManagerState(workspace: WindowDimensions): WindowManagerState {
  return { windows: [], activeId: null, workspace };
}

function findWindow(state: WindowManagerState, id: string): WindowDescriptor | undefined {
  return state.windows.find((window) => window.id === id);
}

function updateWindow(
  state: WindowManagerState,
  id: string,
  update: (window: WindowDescriptor) => WindowDescriptor,
): WindowManagerState {
  return { ...state, windows: state.windows.map((window) => (window.id === id ? update(window) : window)) };
}

function focusWindow(state: WindowManagerState, id: string): WindowManagerState {
  const window = findWindow(state, id);
  if (!window || window.state === 'minimized') return state;

  return { ...state, activeId: id, windows: bringToFront(state.windows, id) };
}

function restoreWindow(state: WindowManagerState, id: string): WindowManagerState {
  return updateWindow(state, id, (window) => window.normalBounds
    ? { ...window, state: 'normal', bounds: window.normalBounds, normalBounds: undefined }
    : { ...window, state: 'normal' });
}

export function windowManagerReducer(state: WindowManagerState, action: WindowManagerAction): WindowManagerState {
  switch (action.type) {
    case 'open': {
      const existing = findWindow(state, action.descriptor.id);
      if (existing) {
        const restored = existing.state === 'minimized'
          ? restoreWindow(state, existing.id)
          : state;
        return focusWindow(restored, existing.id);
      }

      const bounds = clampBounds(action.descriptor.bounds, state.workspace, action.descriptor.minimum);
      const zIndex = Math.max(0, ...state.windows.map((window) => window.zIndex)) + 1;
      return {
        ...state,
        activeId: action.descriptor.id,
        windows: [...state.windows, { ...action.descriptor, bounds, state: 'normal', zIndex }],
      };
    }
    case 'close': {
      const windows = state.windows.filter((window) => window.id !== action.id);
      const wasActive = state.activeId === action.id;
      const activeWindow = [...windows]
        .filter((window) => window.state !== 'minimized')
        .sort((left, right) => right.zIndex - left.zIndex)[0];
      return { ...state, windows, activeId: wasActive ? activeWindow?.id ?? null : state.activeId };
    }
    case 'minimize': {
      const minimized = updateWindow(state, action.id, (window) => ({ ...window, state: 'minimized' }));
      if (state.activeId !== action.id) return minimized;
      const nextActive = [...minimized.windows]
        .filter((window) => window.id !== action.id && window.state !== 'minimized')
        .sort((left, right) => right.zIndex - left.zIndex)[0];
      return { ...minimized, activeId: nextActive?.id ?? null };
    }
    case 'restore': {
      const window = findWindow(state, action.id);
      if (!window) return state;
      const restored = restoreWindow(state, action.id);
      return focusWindow(restored, action.id);
    }
    case 'toggleMaximize': {
      const window = findWindow(state, action.id);
      if (!window || window.state === 'minimized') return state;
      const updated = updateWindow(state, action.id, (current) => {
        if (current.state === 'maximized') {
          return {
            ...current,
            state: 'normal',
            bounds: clampBounds(current.normalBounds ?? current.bounds, state.workspace, current.minimum),
            normalBounds: undefined,
          };
        }
        return {
          ...current,
          state: 'maximized',
          normalBounds: current.bounds,
          bounds: { x: 0, y: 0, width: state.workspace.width, height: state.workspace.height },
        };
      });
      return focusWindow(updated, action.id);
    }
    case 'focus':
      return focusWindow(state, action.id);
    case 'move':
    case 'resize': {
      const window = findWindow(state, action.id);
      if (!window || window.state !== 'normal') return state;
      const updated = updateWindow(state, action.id, (current) => ({
        ...current,
        bounds: action.type === 'resize'
          ? clampResizeBounds(action.bounds, state.workspace, current.minimum, action.edge)
          : clampBounds(action.bounds, state.workspace, current.minimum),
      }));
      return updated;
    }
    case 'setWorkspace': {
      const workspace = action.workspace;
      if (state.workspace.width === workspace.width && state.workspace.height === workspace.height) return state;
      return {
        ...state,
        workspace,
        windows: state.windows.map((window) => {
          const normalBounds = window.normalBounds
            ? clampBounds(window.normalBounds, workspace, window.minimum)
            : undefined;
          if (window.state === 'maximized') {
            return { ...window, bounds: { x: 0, y: 0, width: workspace.width, height: workspace.height }, normalBounds };
          }
          return { ...window, bounds: clampBounds(window.bounds, workspace, window.minimum), normalBounds };
        }),
      };
    }
  }
}
