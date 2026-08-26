import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createExternalWindowService } from '../external-windows/externalWindowService';
import { WindowManagerProvider, useWindowManager } from './WindowManagerProvider';

function ExternalStateProbe() {
  const manager = useWindowManager();
  const state = manager.getPresentationState('data-explorer');
  return <>
    <button type="button" onClick={() => void manager.openExternal('data-explorer')}>Open external</button>
    <output>{state?.external ? 'external-open' : 'external-closed'}</output>
  </>;
}

test('clears the manager external indicator when the native close subscription fires', async () => {
  const user = userEvent.setup();
  let notifyClosed: ((label: string) => void) | undefined;
  const service = createExternalWindowService({
    create: async () => ({ created: true }), focus: async () => undefined, close: async () => undefined,
    onClosed(listener) { notifyClosed = listener; return () => undefined; },
  });
  render(<WindowManagerProvider externalWindowService={service}><ExternalStateProbe /></WindowManagerProvider>);

  await user.click(screen.getByRole('button', { name: 'Open external' }));
  expect(await screen.findByText('external-open')).toBeInTheDocument();
  notifyClosed?.('ember-feature-data-explorer');
  expect(await screen.findByText('external-closed')).toBeInTheDocument();
});
