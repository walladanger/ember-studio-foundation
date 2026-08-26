import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TitleBar, shouldStartTitleBarDragging } from '../shell/TitleBar';
import { createBrowserNativeWindowService } from './nativeWindowService';

test('browser native-window fallback resolves every title-bar operation', async () => {
  const service = createBrowserNativeWindowService();

  await expect(service.minimize()).resolves.toBeUndefined();
  await expect(service.toggleMaximize()).resolves.toBeUndefined();
  await expect(service.close()).resolves.toBeUndefined();
  await expect(service.startDragging()).resolves.toBeUndefined();
});

test('title-bar actions and drag behavior use the injected native-window service', async () => {
  const user = userEvent.setup();
  const service = {
    minimize: vi.fn().mockResolvedValue(undefined),
    toggleMaximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    startDragging: vi.fn().mockResolvedValue(undefined),
  };
  render(<TitleBar nativeWindowService={service} />);

  await user.click(screen.getByRole('button', { name: 'Minimize window' }));
  await user.click(screen.getByRole('button', { name: 'Maximize window' }));
  await user.click(screen.getByRole('button', { name: 'Close window' }));
  await user.pointer({ target: screen.getByTestId('title-bar-drag-region'), keys: '[MouseLeft]' });

  expect(service.minimize).toHaveBeenCalledOnce();
  expect(service.toggleMaximize).toHaveBeenCalledOnce();
  expect(service.close).toHaveBeenCalledOnce();
  expect(service.startDragging).toHaveBeenCalledOnce();
});

test('does not start dragging from a nested SVG inside a window action', () => {
  const button = document.createElement('button');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  button.append(svg);

  expect(shouldStartTitleBarDragging(svg, 0)).toBe(false);
});

test('labels the controlled maximized action as Restore', () => {
  render(<TitleBar isMaximized nativeWindowService={createBrowserNativeWindowService()} />);

  expect(screen.getByRole('button', { name: 'Restore window' })).toBeInTheDocument();
});

test('switches the uncontrolled maximize action to Restore after toggling', async () => {
  const user = userEvent.setup();
  render(<TitleBar nativeWindowService={createBrowserNativeWindowService()} />);

  await user.click(screen.getByRole('button', { name: 'Maximize window' }));
  expect(screen.getByRole('button', { name: 'Restore window' })).toBeInTheDocument();
});
