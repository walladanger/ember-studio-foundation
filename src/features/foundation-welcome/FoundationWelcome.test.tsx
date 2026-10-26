import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoundationWelcome } from './FoundationWelcome';
import { vi } from 'vitest';

test('renders the foundation welcome region with its title, eyebrow, and intro text', () => {
  render(<FoundationWelcome />);

  expect(screen.getByRole('region', { name: 'A clear place to begin.' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'A clear place to begin.' })).toBeInTheDocument();
  expect(screen.getByText('Ember Studio foundation')).toBeInTheDocument();
  expect(screen.getByText('Set up a workspace, shape the tools around it, and grow from a dependable desktop foundation.')).toBeInTheDocument();
});

test('renders all capability sections correctly', () => {
  render(<FoundationWelcome />);

  expect(screen.getByRole('heading', { level: 2, name: 'Organized workspaces' })).toBeInTheDocument();
  expect(screen.getByText('Start with a focused place for the work at hand.')).toBeInTheDocument();

  expect(screen.getByRole('heading', { level: 2, name: 'Clear navigation' })).toBeInTheDocument();
  expect(screen.getByText('Keep tools and context available without clutter.')).toBeInTheDocument();

  expect(screen.getByRole('heading', { level: 2, name: 'Adaptable appearance' })).toBeInTheDocument();
  expect(screen.getByText('Use the selected accent profile across the foundation.')).toBeInTheDocument();

  expect(screen.getByRole('heading', { level: 2, name: 'Ready for extension' })).toBeInTheDocument();
  expect(screen.getByText('Add future features through clean, local boundaries.')).toBeInTheDocument();
});

test('calls onNewWorkspace when the "New workspace" button is clicked', async () => {
  const user = userEvent.setup();
  const onNewWorkspace = vi.fn();

  render(<FoundationWelcome onNewWorkspace={onNewWorkspace} />);

  const button = screen.getByRole('button', { name: /new workspace/i });
  await user.click(button);

  expect(onNewWorkspace).toHaveBeenCalledOnce();
});

test('disables "Data Explorer" and shows placeholder description when onOpenDataExplorer is not provided', () => {
  render(<FoundationWelcome />);

  const button = screen.getByRole('button', { name: 'Data Explorer' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-describedby', 'data-explorer-placeholder');

  // The placeholder text span should be present in the document.
  expect(screen.getByText('Available when the window manager is added.')).toBeInTheDocument();
});

test('enables "Data Explorer" and hides placeholder description when onOpenDataExplorer is provided', async () => {
  const user = userEvent.setup();
  const onOpenDataExplorer = vi.fn();

  render(<FoundationWelcome onOpenDataExplorer={onOpenDataExplorer} />);

  const button = screen.getByRole('button', { name: 'Data Explorer' });
  expect(button).toBeEnabled();
  expect(button).not.toHaveAttribute('aria-describedby');

  // The placeholder text span should not be present.
  expect(screen.queryByText('Available when the window manager is added.')).not.toBeInTheDocument();

  await user.click(button);
  expect(onOpenDataExplorer).toHaveBeenCalledOnce();
});
