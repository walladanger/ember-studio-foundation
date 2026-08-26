export type ColorShade = number;

export interface ColorProfileSelection {
  family: string;
  shade: ColorShade;
}

export interface AccentProfile extends ColorProfileSelection {
  id: string;
  name: string;
  description?: string;
}

export interface AccentTokens {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  focusRing: string;
  selectedBackground: string;
  accentText: string;
}

export interface ThemeSettings {
  colorProfile: AccentProfile;
}

export interface ColorProfileCatalog {
  profiles: readonly AccentProfile[];
  families: readonly string[];
  shadesByFamily: Readonly<Record<string, readonly ColorShade[]>>;
  referenceFamilies: readonly string[];
}
