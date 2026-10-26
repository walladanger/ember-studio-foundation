import { describe, expect, test } from 'vitest';
import { navigationRegistry } from './navigationRegistry';

describe('navigationRegistry', () => {
  test('has the expected number of navigation items', () => {
    expect(navigationRegistry).toHaveLength(6);
  });

  test('all items have unique ids', () => {
    const ids = navigationRegistry.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('all items have unique routes', () => {
    const routes = navigationRegistry.map((item) => item.route);
    const uniqueRoutes = new Set(routes);
    expect(uniqueRoutes.size).toBe(routes.length);
  });

  test('the files item has the correct shortcut configured', () => {
    const filesItem = navigationRegistry.find((item) => item.id === 'files');
    expect(filesItem).toBeDefined();
    expect(filesItem?.shortcut).toBe('Ctrl+O');
  });

  test('all items have required properties', () => {
    navigationRegistry.forEach((item) => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(item.icon).toBeDefined();
      expect(typeof item.route).toBe('string');
    });
  });
});
