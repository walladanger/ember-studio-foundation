import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationProvider';

function NotificationProbe() {
  const { notify } = useNotifications();
  return <>
    <button type="button" onClick={() => notify({ kind: 'progress', title: 'Saving document', progress: 45 })}>Save</button>
    <button type="button" onClick={() => notify({ kind: 'info', title: 'Sync available' })}>Info</button>
  </>;
}

test('announces progress feedback and allows it to be dismissed', async () => {
  const user = userEvent.setup();
  render(<NotificationProvider><NotificationProbe /></NotificationProvider>);

  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('status')).toHaveTextContent('Saving document');
  expect(screen.getByText('45%')).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Saving document' })).toHaveAttribute('aria-valuenow', '45');
  await user.click(screen.getByRole('button', { name: /dismiss saving document/i }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('renders an informational notification with a polite live region', async () => {
  const user = userEvent.setup();
  render(<NotificationProvider><NotificationProbe /></NotificationProvider>);

  await user.click(screen.getByRole('button', { name: 'Info' }));
  expect(screen.getByRole('status')).toHaveTextContent('Sync available');
  expect(screen.getByRole('status')).toHaveClass('notification--info');
});
