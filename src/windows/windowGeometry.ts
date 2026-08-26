import type { ResizeEdge, WindowBounds, WindowDimensions } from './windowTypes';

export const reachableHeaderWidth = 96;
const headerHeight = 38;

export function clampBounds(
  bounds: WindowBounds,
  workspace: WindowDimensions,
  minimum: WindowDimensions,
): WindowBounds {
  const width = Math.max(minimum.width, Math.min(bounds.width, workspace.width));
  const height = Math.max(minimum.height, Math.min(bounds.height, workspace.height));
  const minimumX = -width + reachableHeaderWidth;
  const maximumX = Math.max(minimumX, workspace.width - reachableHeaderWidth);
  const minimumY = 0;
  const maximumY = Math.max(minimumY, workspace.height - headerHeight);

  return {
    x: Math.min(Math.max(bounds.x, minimumX), maximumX),
    y: Math.min(Math.max(bounds.y, minimumY), maximumY),
    width,
    height,
  };
}

export function clampResizeBounds(
  bounds: WindowBounds,
  workspace: WindowDimensions,
  minimum: WindowDimensions,
  edge?: ResizeEdge,
): WindowBounds {
  if (!edge) return clampBounds(bounds, workspace, minimum);

  const width = Math.max(minimum.width, Math.min(bounds.width, workspace.width));
  const height = Math.max(minimum.height, Math.min(bounds.height, workspace.height));
  const anchored = {
    x: edge.includes('west') ? bounds.x + bounds.width - width : bounds.x,
    y: edge.includes('north') ? bounds.y + bounds.height - height : bounds.y,
    width,
    height,
  };

  return clampBounds(anchored, workspace, minimum);
}

export function bringToFront<T extends { id: string; zIndex: number }>(windows: readonly T[], id: string): T[] {
  const nextZIndex = Math.max(0, ...windows.map((window) => window.zIndex)) + 1;

  return windows.map((window) => (window.id === id ? { ...window, zIndex: nextZIndex } : window));
}
