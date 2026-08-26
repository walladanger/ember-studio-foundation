import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './themeStore';
import { SettingsProvider } from '../settings/settingsStore';
import { createMemorySettingsAdapter, createSettingsService, defaultSettings } from '../settings/settingsService';

function ThemeProbe() {
  const { selection, tokens, setSelection } = useTheme();

  return (
    <div>
      <span data-testid="accent-value">{tokens.accent}</span>
      <span data-testid="selection-value">{selection.family}-{selection.shade}</span>
      <button
        type="button"
        onClick={() => setSelection({ family: 'cyan', shade: 400 })}
      >
        Choose cyan
      </button>
    </div>
  );
}

test('applies the selected profile to semantic CSS variables', () => {
  render(
    <ThemeProvider initialSelection={{ family: 'cyan', shade: 400 }}>
      <ThemeProbe />
    </ThemeProvider>,
  );

  expect(screen.getByTestId('accent-value')).toHaveTextContent('#22d3ee');
  expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#22d3ee');
  expect(document.documentElement.style.getPropertyValue('--focus-ring')).toBe('#22d3ee');
});

test('updates only accent variables when a palette swatch is selected', () => {
  render(
    <ThemeProvider initialSelection={{ family: 'sky', shade: 400 }}>
      <ThemeProbe />
    </ThemeProvider>,
  );

  const surfaceBefore = getComputedStyle(document.documentElement).getPropertyValue('--surface');
  const dividerBefore = getComputedStyle(document.documentElement).getPropertyValue('--divider');

  fireEvent.click(screen.getByRole('button', { name: 'Choose cyan' }));

  expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#22d3ee');
  expect(getComputedStyle(document.documentElement).getPropertyValue('--surface')).toBe(surfaceBefore);
  expect(getComputedStyle(document.documentElement).getPropertyValue('--divider')).toBe(dividerBefore);
});

test('uses and persists the profile selection through generic settings', async () => {
  const user = userEvent.setup();
  const adapter = createMemorySettingsAdapter();
  const service = createSettingsService(adapter);
  render(
    <SettingsProvider service={service} initialSettings={{ ...defaultSettings, colorProfile: { family: 'cyan', shade: 400 } }}>
      <ThemeProvider><ThemeProbe /></ThemeProvider>
    </SettingsProvider>,
  );

  expect(screen.getByTestId('accent-value')).toHaveTextContent('#22d3ee');
  await user.click(screen.getByRole('button', { name: 'Choose cyan' }));
  await expect(service.load()).resolves.toMatchObject({ colorProfile: { family: 'cyan', shade: 400 } });
});
