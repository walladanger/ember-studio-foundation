import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { ThemeProvider } from '../design-system/themeStore';
import { DialogProvider } from '../dialogs/DialogProvider';
import { NotificationProvider } from '../notifications/NotificationProvider';
import { SettingsProvider } from '../settings/settingsStore';
import { DataExplorerWindow } from './DataExplorerWindow';

test('exercises generic document feedback and displays the active profile', async () => {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <ThemeProvider>
        <NotificationProvider><DialogProvider><DataExplorerWindow /></DialogProvider></NotificationProvider>
      </ThemeProvider>
    </SettingsProvider>,
  );

  expect(screen.getByText('No active text document')).toBeInTheDocument();
  expect(screen.getByText('Appearance: sky-400')).toBeInTheDocument();
  expect(screen.getByLabelText('Data Explorer window state')).toHaveTextContent('Not open');
  await user.click(screen.getByRole('button', { name: 'Create untitled text' }));
  expect(screen.getAllByText('Untitled text ready')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Create untitled text' }));
  expect(screen.getByRole('dialog', { name: 'Discard text preview?' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await user.click(screen.getByRole('button', { name: 'Save text preview' }));
  expect(screen.getAllByText('Text preview saved')).toHaveLength(2);
});
