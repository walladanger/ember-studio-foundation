import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { InfoTooltip } from './InfoTooltip';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('is hidden by default', () => {
  render(
    <InfoTooltip label="Save">
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
});

it('shows on pointer enter after the default delay', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip label="Save">
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  fireEvent.pointerEnter(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Save');

  const tooltipId = screen.getByRole('tooltip').getAttribute('id');
  expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', tooltipId);
});

it('shows on focus after a custom delay', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip label="Save" delay={200}>
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  fireEvent.focus(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  act(() => vi.advanceTimersByTime(199));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Save');
});

it('hides on pointer leave', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip label="Save">
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  fireEvent.pointerEnter(screen.getByRole('button'));
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole('tooltip')).toBeInTheDocument();

  fireEvent.pointerLeave(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

it('hides on blur', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip label="Save">
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  fireEvent.focus(screen.getByRole('button'));
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole('tooltip')).toBeInTheDocument();

  fireEvent.blur(screen.getByRole('button'));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});


it('renders optional detail elements only when provided', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip title="Save document" description="Write the active text document." guidance="Use Save As for a new location." shortcut="Ctrl+S" status="Ready" warning="Unsaved edits remain." delay={0}>
      <button type="button">Trigger</button>
    </InfoTooltip>,
  );

  fireEvent.focus(screen.getByRole('button'));
  act(() => vi.advanceTimersByTime(0));

  const tooltip = screen.getByRole('tooltip');
  expect(tooltip).toHaveTextContent('Save document');
  expect(tooltip).toHaveTextContent('Write the active text document.');
  expect(tooltip).toHaveTextContent('Use Save As for a new location.');
  expect(tooltip).toHaveTextContent('Ctrl+S');
  expect(tooltip).toHaveTextContent('Ready');
  expect(tooltip).toHaveTextContent('Unsaved edits remain.');
});
