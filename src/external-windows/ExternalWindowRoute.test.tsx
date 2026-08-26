import { render, screen } from '@testing-library/react';
import { ExternalWindowRoute, selectExternalFeature } from './ExternalWindowRoute';
import { windowRegistry } from '../windows/windowRegistry';

test('selects a registered external-capable feature from the host query', () => {
  expect(selectExternalFeature('?window=external&feature=data-explorer', windowRegistry)?.id).toBe('data-explorer');
});

test('rejects internal-only and malformed external host queries', () => {
  const registry = {
    ...windowRegistry,
    internal: { ...windowRegistry['data-explorer'], id: 'internal', presentation: 'internal' as const },
  };

  expect(selectExternalFeature('?window=external&feature=internal', registry)).toBeNull();
  expect(selectExternalFeature('?feature=data-explorer', registry)).toBeNull();
});

test('selects and renders an external-only feature without an internal content component', () => {
  const registry = {
    external: {
      id: 'external',
      title: 'External feature',
      presentation: 'external' as const,
      initialBounds: { x: 0, y: 0, width: 400, height: 300 },
      minimum: { width: 300, height: 200 },
      ExternalContent: () => <p>External-only content</p>,
    },
  };
  const feature = selectExternalFeature('?window=external&feature=external', registry);

  expect(feature?.id).toBe('external');
  render(feature ? <ExternalWindowRoute feature={feature} /> : null);
  expect(screen.getByText('External-only content')).toBeInTheDocument();
});
