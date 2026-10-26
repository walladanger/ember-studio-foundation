import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TitleBar, shouldStartTitleBarDragging } from './TitleBar';
import { NativeWindowService } from '../windows/nativeWindowService';

describe('shouldStartTitleBarDragging', () => {
  it('returns true for a primary button click without interactive target', () => {
    const target = document.createElement('div');
    expect(shouldStartTitleBarDragging(target, 0)).toBe(true);
  });

  it('returns false for non-primary button click', () => {
    const target = document.createElement('div');
    expect(shouldStartTitleBarDragging(target, 1)).toBe(false);
    expect(shouldStartTitleBarDragging(target, 2)).toBe(false);
  });

  it('returns true for null target', () => {
    expect(shouldStartTitleBarDragging(null, 0)).toBe(true);
  });

  it('returns false if target is a button', () => {
    const target = document.createElement('button');
    expect(shouldStartTitleBarDragging(target, 0)).toBe(false);
  });

  it('returns false if target is inside a button', () => {
    const button = document.createElement('button');
    const target = document.createElement('span');
    button.appendChild(target);
    expect(shouldStartTitleBarDragging(target, 0)).toBe(false);
  });
});

describe('TitleBar', () => {
  const createMockNativeWindowService = (): NativeWindowService => ({
    minimize: vi.fn().mockResolvedValue(undefined),
    toggleMaximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    startDragging: vi.fn().mockResolvedValue(undefined),
  });

  it('renders title and window controls', () => {
    render(<TitleBar />);
    expect(screen.getByText('Ember Studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls provided handlers when window controls are clicked', async () => {
    const user = userEvent.setup();
    const onMinimize = vi.fn();
    const onToggleMaximize = vi.fn();
    const onClose = vi.fn();

    render(
      <TitleBar
        onMinimize={onMinimize}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /minimize/i }));
    expect(onMinimize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /maximize/i }));
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls native handlers when provided handlers are absent', async () => {
    const user = userEvent.setup();
    const mockService = createMockNativeWindowService();

    render(<TitleBar nativeWindowService={mockService} />);

    await user.click(screen.getByRole('button', { name: /minimize/i }));
    expect(mockService.minimize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /maximize/i }));
    expect(mockService.toggleMaximize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(mockService.close).toHaveBeenCalledTimes(1);
  });

  it('starts dragging on primary pointer down on the bar (explicit event)', () => {
    const mockService = createMockNativeWindowService();
    render(<TitleBar nativeWindowService={mockService} />);

    // We get the header by its role or closest generic wrapper
    const header = screen.getByRole('banner'); // <header> element

    // We simulate a pointer down on the header
    const event = new PointerEvent('pointerdown', { button: 0, bubbles: true });
    Object.defineProperty(event, 'target', { value: header, enumerable: true });

    header.dispatchEvent(event);

    expect(mockService.startDragging).toHaveBeenCalledTimes(1);
  });

  it('does not start dragging on primary pointer down on a button (explicit event)', () => {
    const mockService = createMockNativeWindowService();
    render(<TitleBar nativeWindowService={mockService} />);

    const minimizeBtn = screen.getByRole('button', { name: /minimize/i });
    const event = new PointerEvent('pointerdown', { button: 0, bubbles: true });
    Object.defineProperty(event, 'target', { value: minimizeBtn, enumerable: true });

    minimizeBtn.dispatchEvent(event);

    expect(mockService.startDragging).not.toHaveBeenCalled();
  });
});
