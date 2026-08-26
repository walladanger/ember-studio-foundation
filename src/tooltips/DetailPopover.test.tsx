import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { InfoTooltip } from './InfoTooltip';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('shows delayed detailed hover information on focus with configured guidance', () => {
  vi.useFakeTimers();
  render(
    <InfoTooltip title="Save document" description="Write the active text document." guidance="Use Save As for a new location." shortcut="Ctrl+S" status="Ready" warning="Unsaved edits remain." delay={300}>
      <button type="button">Save</button>
    </InfoTooltip>,
  );

  fireEvent.focus(screen.getByRole('button', { name: 'Save' }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Use Save As for a new location.');
  expect(screen.getByRole('tooltip')).toHaveTextContent('Ctrl+S');
  expect(screen.getByRole('tooltip')).toHaveTextContent('Unsaved edits remain.');
});

test('uses the compact variant for a short label', () => {
  vi.useFakeTimers();
  render(<InfoTooltip label="Open settings" delay={1}><button type="button">Settings</button></InfoTooltip>);
  fireEvent.focus(screen.getByRole('button', { name: 'Settings' }));
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Open settings');
});

test('aligns the panel inward when its trigger is at a viewport edge', () => {
  vi.useFakeTimers();
  render(<InfoTooltip label="Edge label" delay={1}><button type="button">Edge</button></InfoTooltip>);
  const trigger = screen.getByRole('button', { name: 'Edge' });
  Object.defineProperty(trigger.parentElement, 'getBoundingClientRect', {
    value: () => ({ top: 20, bottom: 40, left: 0, right: 20 }),
  });

  fireEvent.focus(trigger);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('tooltip')).toHaveAttribute('data-align', 'start');
});

test('cleans up a pending hover delay when unmounted', () => {
  vi.useFakeTimers();
  const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
  const { unmount } = render(<InfoTooltip label="Pending" delay={500}><button type="button">Pending</button></InfoTooltip>);
  fireEvent.focus(screen.getByRole('button', { name: 'Pending' }));
  unmount();

  expect(clearTimeoutSpy).toHaveBeenCalled();
});

test('refines placement using the rendered detail-panel dimensions', () => {
  vi.useFakeTimers();
  const original = HTMLElement.prototype.getBoundingClientRect;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('info-tooltip__panel')) {
      return { top: 50, bottom: 200, left: 0, right: 400, width: 400, height: 150, x: 0, y: 50, toJSON: () => ({}) } as DOMRect;
    }
    return { top: 20, bottom: 40, left: 390, right: 410, width: 20, height: 20, x: 390, y: 20, toJSON: () => ({}) } as DOMRect;
  });
  render(<InfoTooltip title="Measured" description="A detailed panel" delay={1}><button type="button">Measure</button></InfoTooltip>);

  fireEvent.focus(screen.getByRole('button', { name: 'Measure' }));
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('tooltip')).toHaveAttribute('data-align', 'end');
  HTMLElement.prototype.getBoundingClientRect = original;
});

test('uses the less-clipped vertical side when a measured panel fits neither side', () => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('info-tooltip__panel')) {
      return { top: 0, bottom: 200, left: 0, right: 240, width: 240, height: 200, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    }
    return { top: 180, bottom: 200, left: 100, right: 120, width: 20, height: 20, x: 100, y: 180, toJSON: () => ({}) } as DOMRect;
  });
  render(<InfoTooltip title="Tall" description="Measured panel" delay={1}><button type="button">Tall</button></InfoTooltip>);

  fireEvent.focus(screen.getByRole('button', { name: 'Tall' }));
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', 'top');
});
