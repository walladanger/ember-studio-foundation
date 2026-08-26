import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  applyAccentTokens,
  buildAccentTokens,
  colorProfiles,
  defaultColorProfile,
} from './colorProfiles';
import { useOptionalSettings } from '../settings/settingsStore';
import './theme.css';
import type {
  AccentProfile,
  AccentTokens,
  ColorProfileSelection,
  ThemeSettings,
} from '../types/theme';

export interface ThemeContextValue {
  settings: ThemeSettings;
  selection: ColorProfileSelection;
  tokens: AccentTokens;
  profiles: readonly AccentProfile[];
  setSelection: (selection: ColorProfileSelection) => void;
}

export interface ThemeProviderProps extends PropsWithChildren {
  initialSelection?: ColorProfileSelection;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function profileForSelection(selection: ColorProfileSelection): AccentProfile {
  return (
    colorProfiles.find(
      (profile) => profile.family === selection.family && profile.shade === selection.shade,
    ) ?? {
      id: `${selection.family}-${selection.shade}`,
      name: `${selection.family}-${selection.shade}`,
      family: selection.family,
      shade: selection.shade,
      description: 'A custom Tailwind accent selection.',
    }
  );
}

export function ThemeProvider({ children, initialSelection }: ThemeProviderProps) {
  const appSettings = useOptionalSettings();
  const [selection, setSelection] = useState<ColorProfileSelection>(
    initialSelection ?? appSettings?.settings.colorProfile ?? {
      family: defaultColorProfile.family,
      shade: defaultColorProfile.shade,
    },
  );
  const setProfileSelection = useCallback((next: ColorProfileSelection) => {
    setSelection(next);
    void appSettings?.update({ colorProfile: next });
  }, [appSettings]);
  useEffect(() => {
    if (!initialSelection && appSettings) setSelection(appSettings.settings.colorProfile);
  }, [appSettings?.settings.colorProfile, initialSelection]);
  const tokens = useMemo(() => buildAccentTokens(selection), [selection]);
  const settings = useMemo<ThemeSettings>(
    () => ({ colorProfile: profileForSelection(selection) }),
    [selection],
  );

  useLayoutEffect(() => {
    applyAccentTokens(tokens);
    document.documentElement.dataset.colorProfile = `${selection.family}-${selection.shade}`;
  }, [selection, tokens]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      settings,
      selection,
      tokens,
      profiles: colorProfiles,
      setSelection: setProfileSelection,
    }),
    [selection, setProfileSelection, settings, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
