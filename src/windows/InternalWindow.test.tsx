import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { InternalWindow } from './InternalWindow';
import { WindowManagerProvider, WindowManagerWorkspace, useWindowManager } from './WindowManagerProvider';

const sampleWindow = {
  id: 'data-explorer',
  title: 'Data Explorer',
  state: 'normal' as const,
  zIndex: 2,
  bounds: { x: 80, y: 60, width: 720, height: 480 },
  minimum: { width: 360, height: 240 },
};

function pointerEvent(type: string, pointerId: number, clientX: number, clientY: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
}

test('clicking an inactive window requests focus', async () => {
  const user = userEvent.setup();
  const onFocus = vi.fn();

  render(
    <InternalWindow descriptor={sampleWindow} workspace={{ width: 1200, height: 700 }} onFocus={onFocus}>
      Content
    </InternalWindow>,
  );

  await user.click(screen.getByRole('heading', { name: /data explorer/i }));

  expect(onFocus).toHaveBeenCalledWith('data-explorer');
});

test('renders window actions with accessible labels', () => {
  render(
    <InternalWindow descriptor={sampleWindow} workspace={{ width: 1200, height: 700 }} onFocus={vi.fn()}>
      Content
    </InternalWindow>,
  );

  expect(screen.getByRole('button', { name: /minimize data explorer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /maximize data explorer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /close data explorer/i })).toBeInTheDocument();
});

test('header drag and west resize emit pointer-derived bounds', () => {
  const onFocus = vi.fn();
  const onMove = vi.fn();
  const onResize = vi.fn();
  const { container } = render(
    <InternalWindow descriptor={sampleWindow} workspace={{ width: 1200, height: 700 }} onFocus={onFocus} onMove={onMove} onResize={onResize}>
      Content
    </InternalWindow>,
  );
  const header = screen.getByRole('heading', { name: /data explorer/i }).closest('header') as HTMLElement;
  const westHandle = container.querySelector('.internal-window__resize-handle--west') as HTMLElement;

  fireEvent(header, pointerEvent('pointerdown', 1, 100, 100));
  fireEvent(header, pointerEvent('pointermove', 1, 140, 130));
  fireEvent(header, pointerEvent('pointerup', 1, 140, 130));
  fireEvent(westHandle, pointerEvent('pointerdown', 2, 100, 100));
  fireEvent(westHandle, pointerEvent('pointermove', 2, 140, 100));

  expect(onMove).toHaveBeenCalledWith('data-explorer', { x: 120, y: 90, width: 720, height: 480 });
  expect(onResize).toHaveBeenCalledWith('data-explorer', { x: 120, y: 60, width: 680, height: 480 }, 'west');
  expect(onFocus).toHaveBeenCalledTimes(2);
});

function StatefulWindow({ label }: { label: string }) {
  const [value, setValue] = useState('');
  return <input aria-label={label} value={value} onChange={(event) => setValue(event.target.value)} />;
}

const preservationRegistry = {
  preserved: {
    id: 'preserved',
    title: 'Preserved',
    presentation: 'internal' as const,
    initialBounds: { x: 20, y: 20, width: 360, height: 240 },
    minimum: { width: 360, height: 240 },
    preserveState: true,
    InternalContent: () => <StatefulWindow label="Preserved value" />,
  },
  transient: {
    id: 'transient',
    title: 'Transient',
    presentation: 'internal' as const,
    initialBounds: { x: 40, y: 40, width: 360, height: 240 },
    minimum: { width: 360, height: 240 },
    preserveState: false,
    InternalContent: () => <StatefulWindow label="Transient value" />,
  },
};

function ProviderHarness({ navigationKey }: { navigationKey: string }) {
  const { open } = useWindowManager();
  return (
    <>
      <button type="button" onClick={() => open('preserved')}>Open preserved</button>
      <button type="button" onClick={() => open('transient')}>Open transient</button>
      <WindowManagerWorkspace navigationKey={navigationKey}><div>Workspace</div></WindowManagerWorkspace>
    </>
  );
}

test('provider preserves opted-in feature content while navigation changes', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <WindowManagerProvider registry={preservationRegistry}>
      <ProviderHarness navigationKey="home" />
    </WindowManagerProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Open preserved' }));
  await user.click(screen.getByRole('button', { name: 'Open transient' }));
  await user.type(screen.getByRole('textbox', { name: 'Preserved value' }), 'kept');
  await user.type(screen.getByRole('textbox', { name: 'Transient value' }), 'reset');
  rerender(
    <WindowManagerProvider registry={preservationRegistry}>
      <ProviderHarness navigationKey="files" />
    </WindowManagerProvider>,
  );

  expect(screen.getByRole('textbox', { name: 'Preserved value' })).toHaveValue('kept');
  expect(screen.getByRole('textbox', { name: 'Transient value' })).toHaveValue('');
});

test('provider keeps opted-in content mounted through minimize and restore', async () => {
  const user = userEvent.setup();
  render(
    <WindowManagerProvider registry={preservationRegistry}>
      <ProviderHarness navigationKey="home" />
    </WindowManagerProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Open preserved' }));
  await user.type(screen.getByRole('textbox', { name: 'Preserved value' }), 'kept');
  await user.click(screen.getByRole('button', { name: 'Minimize Preserved' }));

  expect(screen.queryByRole('dialog', { name: 'Preserved' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Preserved value', hidden: true })).toHaveValue('kept');
  const minimizedButton = screen.getByRole('button', { name: 'Preserved' });
  expect(minimizedButton).toHaveFocus();
  expect(minimizedButton).toHaveAttribute('data-minimized-window-id', 'preserved');
  await user.click(minimizedButton);
  expect(screen.getByRole('textbox', { name: 'Preserved value' })).toHaveValue('kept');
});

const resizeRegistry = {
  resizable: {
    id: 'resizable',
    title: 'Resizable',
    presentation: 'internal' as const,
    initialBounds: { x: 80, y: 60, width: 400, height: 280 },
    minimum: { width: 360, height: 240 },
    InternalContent: () => <div>Resizable content</div>,
  },
};

function ResizeProviderHarness() {
  const { open, resize } = useWindowManager();
  return (
    <>
      <button type="button" onClick={() => open('resizable')}>Open resizable</button>
      <button type="button" onClick={() => resize('resizable', { x: 280, y: 60, width: 200, height: 280 }, 'west')}>Resize west</button>
      <WindowManagerWorkspace><div>Workspace</div></WindowManagerWorkspace>
    </>
  );
}

test('provider forwards a resize edge for an opened internal feature', async () => {
  const user = userEvent.setup();
  render(
    <WindowManagerProvider registry={resizeRegistry}>
      <ResizeProviderHarness />
    </WindowManagerProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Open resizable' }));
  await user.click(screen.getByRole('button', { name: 'Resize west' }));

  expect(screen.getByRole('dialog', { name: 'Resizable' })).toHaveStyle({ left: '120px', width: '360px' });
});
