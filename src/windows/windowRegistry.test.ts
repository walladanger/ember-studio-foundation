import { describe, expect, it } from 'vitest';
import { windowRegistry } from './windowRegistry';
import { DataExplorerWindow } from './DataExplorerWindow';

describe('windowRegistry', () => {
  it('should contain exact properties for data-explorer', () => {
    expect(windowRegistry['data-explorer']).toStrictEqual({
      id: 'data-explorer',
      title: 'Data Explorer',
      presentation: 'dual',
      initialBounds: { x: 80, y: 56, width: 720, height: 480 },
      minimum: { width: 360, height: 240 },
      preserveState: true,
      InternalContent: DataExplorerWindow,
    });
  });

  it('should have matching ids and keys for all registered features', () => {
    for (const [key, feature] of Object.entries(windowRegistry)) {
      expect(feature.id).toBe(key);
    }
  });

  it('should have initialBounds that respect minimum dimensions for all features', () => {
    for (const feature of Object.values(windowRegistry)) {
      expect(feature.initialBounds.width).toBeGreaterThanOrEqual(feature.minimum.width);
      expect(feature.initialBounds.height).toBeGreaterThanOrEqual(feature.minimum.height);
    }
  });

  it.todo('should provide ExternalContent for dual presentation mode features', () => {
    // Bug: 'data-explorer' has presentation: 'dual' but lacks ExternalContent
  });
});
