import colors from 'tailwindcss/colors';
import type {
  AccentProfile,
  AccentTokens,
  ColorProfileCatalog,
  ColorProfileSelection,
  ColorShade,
} from '../types/theme';

type TailwindPalette = Record<string, string | Record<string, string>>;

const palette = colors as unknown as TailwindPalette;
const excludedFamilies = new Set(['inherit', 'current', 'transparent']);
const deprecatedAliases = new Set(['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']);
const referenceFamilies = ['black', 'white'] as const;

function isShadeKey(key: string): boolean {
  return /^\d+$/.test(key);
}

function getFamilyPalette(family: string): Record<string, string> | undefined {
  const value = palette[family];
  return value && typeof value === 'object' ? value : undefined;
}

export function getColorFamilies(): string[] {
  return Object.keys(palette)
    .filter((family) => !excludedFamilies.has(family) && !deprecatedAliases.has(family))
    .filter((family) => family !== 'black' && family !== 'white');
}

export function getReferenceColorFamilies(): readonly string[] {
  return referenceFamilies;
}

export function getColorShades(family: string): ColorShade[] {
  const familyPalette = getFamilyPalette(family);

  return familyPalette
    ? Object.keys(familyPalette)
        .filter(isShadeKey)
        .map(Number)
        .sort((left, right) => left - right)
    : [];
}

function getColor(family: string, shade: ColorShade): string {
  const value = getFamilyPalette(family)?.[String(shade)];

  if (!value) {
    throw new Error(`Unknown Tailwind color selection: ${family}-${shade}`);
  }

  return value;
}

export function getColorHex(family: string, shade?: ColorShade): string {
  const value = palette[family];

  if (typeof value === 'string') {
    return value;
  }

  if (shade === undefined) {
    throw new Error(`A shade is required for the ${family} color family`);
  }

  return getColor(family, shade);
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

export function buildAccentTokens(selection: ColorProfileSelection): AccentTokens {
  const accent = getColor(selection.family, selection.shade);
  const shades = getColorShades(selection.family);
  const strongShade = shades.find((shade) => shade >= 600) ?? selection.shade;
  const accentStrong = getColor(selection.family, strongShade);

  return {
    accent,
    accentStrong,
    accentSoft: withAlpha(accent, '26'),
    focusRing: accent,
    selectedBackground: withAlpha(accent, '1f'),
    accentText: accent,
  };
}

export function applyAccentTokens(tokens: AccentTokens): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--accent-strong', tokens.accentStrong);
  root.style.setProperty('--accent-soft', tokens.accentSoft);
  root.style.setProperty('--focus-ring', tokens.focusRing);
  root.style.setProperty('--selected-background', tokens.selectedBackground);
  root.style.setProperty('--accent-text', tokens.accentText);
}

export const colorProfiles: readonly AccentProfile[] = [
  {
    id: 'slate-blue',
    name: 'Slate Blue',
    family: 'sky',
    shade: 400,
    description: 'The balanced cool-blue default.',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    family: 'slate',
    shade: 500,
    description: 'A restrained slate accent for focused work.',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    family: 'cyan',
    shade: 300,
    description: 'A brighter cool accent for stronger separation.',
  },
];

export function getColorProfileCatalog(): ColorProfileCatalog {
  const families = getColorFamilies();

  return {
    profiles: colorProfiles,
    families,
    shadesByFamily: Object.fromEntries(
      families.map((family) => [family, getColorShades(family)]),
    ),
    referenceFamilies,
  };
}

export const defaultColorProfile = colorProfiles[0];
