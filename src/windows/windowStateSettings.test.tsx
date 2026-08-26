import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { SettingsProvider } from '../settings/settingsStore';
import { useNativeWindowStateLifecycle, useWindowStateSettings } from './windowState';
import { createMemorySettingsAdapter, createSettingsService, defaultSettings } from '../settings/settingsService';

function InvalidStateSaveProbe() {
  const { save } = useWindowStateSettings('main');
  const [result, setResult] = useState('idle');
  const saveInvalid = async () => {
    try {
      await save({ bounds: { x: 0, y: 0, width: 0, height: 100 }, maximized: false });
      setResult('accepted');
    } catch { setResult('rejected'); }
  };
  return <><button type="button" onClick={() => void saveInvalid()}>Save invalid state</button><output>{result}</output></>;
}

test('settings hook rejects invalid state instead of persisting raw bounds', async () => {
  const user = userEvent.setup();
  render(<SettingsProvider><InvalidStateSaveProbe /></SettingsProvider>);

  await user.click(screen.getByRole('button', { name: 'Save invalid state' }));
  expect(await screen.findByText('rejected')).toBeInTheDocument();
});

function LifecycleProbe() {
  useNativeWindowStateLifecycle('main', {
    capture: async () => ({ bounds: { x: -840, y: 30, width: 840, height: 560 }, maximized: false }),
    restore: async () => undefined,
  });
  return null;
}

test('persists captured native state during lifecycle cleanup', async () => {
  const service = createSettingsService(createMemorySettingsAdapter());
  const { unmount } = render(<SettingsProvider service={service} initialSettings={defaultSettings}><LifecycleProbe /></SettingsProvider>);

  unmount();

  await vi.waitFor(async () => expect((await service.load()).extensionSettings).toEqual({
    nativeWindowStates: { main: { version: 1, bounds: { x: -840, y: 30, width: 840, height: 560 }, maximized: false } },
  }));
});
