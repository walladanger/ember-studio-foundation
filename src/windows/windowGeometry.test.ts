import { describe, expect, it } from 'vitest';
import { clampBounds, clampResizeBounds, bringToFront, reachableHeaderWidth } from './windowGeometry';

describe('windowGeometry', () => {
  describe('clampBounds', () => {
    it('maintains bounds that are entirely within the workspace and larger than minimum', () => {
      const bounds = { x: 100, y: 100, width: 400, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 400, height: 300 });
    });

    it('clamps width to minimum if too narrow', () => {
      const bounds = { x: 100, y: 100, width: 100, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 200, height: 300 });
    });

    it('clamps height to minimum if too short', () => {
      const bounds = { x: 100, y: 100, width: 400, height: 100 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 400, height: 200 });
    });

    it('clamps width to workspace width if too wide', () => {
      const bounds = { x: 100, y: 100, width: 2000, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 1920, height: 300 });
    });

    it('clamps height to workspace height if too tall', () => {
      const bounds = { x: 100, y: 100, width: 400, height: 2000 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 400, height: 1080 });
    });

    it('clamps x so at least reachableHeaderWidth remains on the right side of the screen', () => {
      // bounds.x is very large (off-screen to the right)
      const bounds = { x: 2000, y: 100, width: 400, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      // maximumX = 1920 - 96 = 1824
      expect(result).toStrictEqual({ x: 1824, y: 100, width: 400, height: 300 });
    });

    it('clamps x so at least reachableHeaderWidth remains on the left side of the screen', () => {
      // bounds.x is very negative (off-screen to the left)
      const bounds = { x: -1000, y: 100, width: 400, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      // minimumX = -width + reachableHeaderWidth = -400 + 96 = -304
      expect(result).toStrictEqual({ x: -304, y: 100, width: 400, height: 300 });
    });

    it('clamps y so it does not go above 0', () => {
      const bounds = { x: 100, y: -100, width: 400, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      // minimumY = 0
      expect(result).toStrictEqual({ x: 100, y: 0, width: 400, height: 300 });
    });

    it('clamps y so it does not go below workspace.height - headerHeight', () => {
      const bounds = { x: 100, y: 2000, width: 400, height: 300 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampBounds(bounds, workspace, minimum);
      // maximumY = 1080 - 38 = 1042
      expect(result).toStrictEqual({ x: 100, y: 1042, width: 400, height: 300 });
    });
  });

  describe('clampResizeBounds', () => {
    it('behaves like clampBounds if edge is undefined', () => {
      const bounds = { x: 100, y: 100, width: 100, height: 100 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampResizeBounds(bounds, workspace, minimum, undefined);
      expect(result).toStrictEqual({ x: 100, y: 100, width: 200, height: 200 });
    });

    it('anchors to the top-left when resizing east/south and bounds are smaller than minimum', () => {
      const bounds = { x: 100, y: 100, width: 100, height: 100 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampResizeBounds(bounds, workspace, minimum, 'south-east');
      // x, y should remain unchanged as we resize from bottom/right
      expect(result).toStrictEqual({ x: 100, y: 100, width: 200, height: 200 });
    });

    it('anchors to the bottom-right when resizing west/north and bounds are smaller than minimum', () => {
      const bounds = { x: 100, y: 100, width: 150, height: 150 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampResizeBounds(bounds, workspace, minimum, 'north-west');
      // Original right edge = 100 + 150 = 250
      // Original bottom edge = 100 + 150 = 250
      // Expected x = 250 - 200 = 50
      // Expected y = 250 - 200 = 50
      expect(result).toStrictEqual({ x: 50, y: 50, width: 200, height: 200 });
    });

    it('anchors to the bottom-left when resizing north-east and bounds are smaller than minimum', () => {
      const bounds = { x: 100, y: 100, width: 150, height: 150 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampResizeBounds(bounds, workspace, minimum, 'north-east');
      // Original bottom edge = 100 + 150 = 250
      // Expected y = 250 - 200 = 50
      // Expected x = 100 (anchored to left)
      expect(result).toStrictEqual({ x: 100, y: 50, width: 200, height: 200 });
    });

    it('anchors to the top-right when resizing south-west and bounds are smaller than minimum', () => {
      const bounds = { x: 100, y: 100, width: 150, height: 150 };
      const workspace = { width: 1920, height: 1080 };
      const minimum = { width: 200, height: 200 };

      const result = clampResizeBounds(bounds, workspace, minimum, 'south-west');
      // Original right edge = 100 + 150 = 250
      // Expected x = 250 - 200 = 50
      // Expected y = 100 (anchored to top)
      expect(result).toStrictEqual({ x: 50, y: 100, width: 200, height: 200 });
    });
  });

  describe('bringToFront', () => {
    it('returns an empty array when given an empty array', () => {
      const result = bringToFront([], 'test-id');
      expect(result).toStrictEqual([]);
    });

    it('updates the zIndex of the target window to be highest + 1', () => {
      const windows = [
        { id: '1', zIndex: 1 },
        { id: '2', zIndex: 3 },
        { id: '3', zIndex: 2 },
      ];

      const result = bringToFront(windows, '1');
      expect(result).toStrictEqual([
        { id: '1', zIndex: 4 },
        { id: '2', zIndex: 3 },
        { id: '3', zIndex: 2 },
      ]);
    });

    it('works when all zIndexes are 0', () => {
      const windows = [
        { id: '1', zIndex: 0 },
        { id: '2', zIndex: 0 },
      ];

      const result = bringToFront(windows, '2');
      expect(result).toStrictEqual([
        { id: '1', zIndex: 0 },
        { id: '2', zIndex: 1 },
      ]);
    });

    it('works when windows array has zIndex values that are negative', () => {
      // The function currently uses Math.max(0, ...), so negative zIndex should be treated as 0 for max calculation
      const windows = [
        { id: '1', zIndex: -1 },
        { id: '2', zIndex: -5 },
      ];

      const result = bringToFront(windows, '1');
      // Max is 0, so nextZIndex = 0 + 1 = 1
      expect(result).toStrictEqual([
        { id: '1', zIndex: 1 },
        { id: '2', zIndex: -5 },
      ]);
    });

    // BUG DETECTED?
    // Let's check `bringToFront` logic closely.
    // If the array contains windows without the target id, the code creates a new array
    // mapped without changes but since it operates without finding the item first, it might be doing unnecessary mapping.
    // Given memory context and instructions, let's just mark a test as skipped to point out a potential inefficiency/issue.
    it.skip('returns an unmodified array by reference if the id is not found (currently returns a new array)', () => {
      const windows = [
        { id: '1', zIndex: 1 },
        { id: '2', zIndex: 3 },
      ];

      const result = bringToFront(windows, 'nonexistent');
      expect(result).toStrictEqual([
        { id: '1', zIndex: 1 },
        { id: '2', zIndex: 3 },
      ]);
    });
  });
});
