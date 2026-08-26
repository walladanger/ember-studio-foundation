import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { DialogProvider, useDialogs } from './DialogProvider';

function DialogProbe() {
  const { confirm } = useDialogs();
  return <button type="button" onClick={async () => document.body.dataset.confirmed = String(await confirm({ title: 'Discard changes?', description: 'Unsaved edits will be lost.', confirmLabel: 'Discard' }))}>Request confirmation</button>;
}

function QueueProbe() {
  const { confirm, error } = useDialogs();
  return <button type="button" onClick={() => {
    void confirm({ title: 'First confirmation' }).then((confirmed) => { document.body.dataset.first = String(confirmed); });
    void error({ title: 'Second error' }).then(() => { document.body.dataset.second = 'closed'; });
  }}>Queue dialogs</button>;
}

function ErrorProbe() {
  const { error } = useDialogs();
  return <button type="button" onClick={() => void error({ title: 'Cannot save', description: 'Storage is unavailable.' })}>Show error</button>;
}

test('resolves a confirmation request as cancelled with Escape and restores trigger focus', async () => {
  const user = userEvent.setup();
  render(<DialogProvider><DialogProbe /></DialogProvider>);
  const trigger = screen.getByRole('button', { name: 'Request confirmation' });

  await user.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  await user.keyboard('{Escape}');

  expect(document.body.dataset.confirmed).toBe('false');
  expect(trigger).toHaveFocus();
});

test('queues concurrent dialog requests in order', async () => {
  const user = userEvent.setup();
  render(<DialogProvider><QueueProbe /></DialogProvider>);

  await user.click(screen.getByRole('button', { name: 'Queue dialogs' }));
  expect(screen.getByRole('dialog', { name: 'First confirmation' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(document.body.dataset.first).toBe('true');
  expect(screen.getByRole('dialog', { name: 'Second error' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(document.body.dataset.second).toBe('closed');
});

test('focuses an error dialog close action and returns focus after Escape', async () => {
  const user = userEvent.setup();
  render(<DialogProvider><ErrorProbe /></DialogProvider>);
  const trigger = screen.getByRole('button', { name: 'Show error' });

  await user.click(trigger);
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
});
