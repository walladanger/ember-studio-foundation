import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../settings/settingsStore';
import { createMemorySettingsAdapter, createSettingsService, defaultSettings } from '../settings/settingsService';

test('renders the full-height navigation and custom title-bar actions', () => {
  render(<AppShell />);

  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
});

test('uses generic settings for the initial and updated navigation collapse state', async () => {
  const user = userEvent.setup();
  const service = createSettingsService(createMemorySettingsAdapter());
  render(
    <SettingsProvider service={service} initialSettings={{ ...defaultSettings, navigationCollapsed: true }}>
      <AppShell />
    </SettingsProvider>,
  );

  expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed', 'true');
  await user.click(screen.getByRole('button', { name: /expand navigation/i }));
  await expect(service.load()).resolves.toMatchObject({ navigationCollapsed: false });
});
