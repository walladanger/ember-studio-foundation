import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect } from 'vitest';
import { SettingsProvider, useSettings } from './settingsStore';
import { createMemorySettingsAdapter, createSettingsService, defaultSettings } from './settingsService';
import type { AppSettings, SettingsService } from './settingsTypes';

function SettingsProbe() {
  const { settings, persistence, update } = useSettings();
  return (
    <>
      <span data-testid="navigation-state">{String(settings.navigationCollapsed)}</span>
      <span data-testid="persistence-state">{persistence.kind}</span>
      <button type="button" onClick={() => update({ navigationCollapsed: true })}>Collapse navigation</button>
    </>
  );
}

test('provides defaults and persists a typed settings update', async () => {
  const user = userEvent.setup();
  const adapter = createMemorySettingsAdapter();
  const service = createSettingsService(adapter);

  render(
    <SettingsProvider service={service} initialSettings={defaultSettings}>
      <SettingsProbe />
    </SettingsProvider>,
  );

  expect(screen.getByTestId('navigation-state')).toHaveTextContent('false');
  await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));
  expect(screen.getByTestId('navigation-state')).toHaveTextContent('true');
  await expect(service.load()).resolves.toMatchObject({ navigationCollapsed: true });
});

test('hydrates provider state from its persistence service', async () => {
  const service = createSettingsService(createMemorySettingsAdapter(JSON.stringify({ ...defaultSettings, navigationCollapsed: true })));
  render(<SettingsProvider service={service}><SettingsProbe /></SettingsProvider>);

  await waitFor(() => expect(screen.getByTestId('navigation-state')).toHaveTextContent('true'));
});

test('keeps the provider usable when persistence rejects', async () => {
  const user = userEvent.setup();
  const failingService: SettingsService<AppSettings> = {
    load: async () => defaultSettings,
    save: async () => { throw new Error('storage unavailable'); },
    reset: async () => defaultSettings,
  };
  render(<SettingsProvider service={failingService} initialSettings={defaultSettings}><SettingsProbe /></SettingsProvider>);

  await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));
  expect(screen.getByTestId('navigation-state')).toHaveTextContent('true');
  await waitFor(() => expect(screen.getByTestId('persistence-state')).toHaveTextContent('failure'));
});
