import type { CSSProperties } from 'react';
import {
  getColorHex,
  getColorProfileCatalog,
  getColorShades,
  getReferenceColorFamilies,
} from './colorProfiles';
import type { ColorProfileSelection } from '../types/theme';
import './theme.css';

export interface ColorProfilePopoverProps {
  value: ColorProfileSelection;
  onChange: (selection: ColorProfileSelection) => void;
  onClose: () => void;
}

export function ColorProfilePopover({ value, onChange, onClose }: ColorProfilePopoverProps) {
  const catalog = getColorProfileCatalog();
  const shades = getColorShades(value.family);
  const selectedProfile = catalog.profiles.find(
    (profile) => profile.family === value.family && profile.shade === value.shade,
  );

  return (
    <section className="color-profile-popover" role="dialog" aria-label="Color profile">
      <div className="color-profile-popover__header">
        <div>
          <p className="color-profile-popover__title">Color profile</p>
          <span>{selectedProfile?.name ?? `${value.family}-${value.shade}`}</span>
        </div>
        <button
          className="color-profile-popover__close"
          type="button"
          aria-label="Close color profile"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="color-profile-popover__section">
        <div className="color-profile-popover__section-heading">
          <span>Families</span>
          <span>{value.family}</span>
        </div>
        <div className="color-profile-popover__swatches" aria-label="Color families">
          {catalog.families.map((family) => {
            const familyShades = getColorShades(family);
            const familyShade = familyShades.includes(value.shade)
              ? value.shade
              : familyShades[Math.floor(familyShades.length / 2)];

            return (
              <button
                className="color-profile-popover__swatch color-profile-popover__family-swatch"
                key={family}
                type="button"
                aria-label={`${family} family (${family}-${familyShade})`}
                aria-pressed={value.family === family}
                style={{ '--swatch-color': getColorHex(family, familyShade) } as CSSProperties}
                onClick={() => onChange({ family, shade: familyShade })}
              />
            );
          })}
        </div>
      </div>

      <div className="color-profile-popover__section">
        <div className="color-profile-popover__section-heading">
          <span>Shades</span>
          <span>{value.family}</span>
        </div>
        <div className="color-profile-popover__swatches" aria-label={`${value.family} shades`}>
          {shades.map((shade) => (
            <button
              className="color-profile-popover__swatch"
              key={shade}
              type="button"
              aria-label={`${value.family}-${shade}`}
              aria-pressed={value.shade === shade}
              style={{ '--swatch-color': getColorHex(value.family, shade) } as CSSProperties}
              onClick={() => onChange({ family: value.family, shade })}
            >
              <span className="sr-only">{value.family}-{shade}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="color-profile-popover__section">
        <div className="color-profile-popover__section-heading">
          <span>Reference</span>
          <span>Not selectable</span>
        </div>
        <div className="color-profile-popover__reference" aria-label="Reference swatches">
          {getReferenceColorFamilies().map((family) => (
            <span
              className="color-profile-popover__reference-swatch"
              key={family}
              aria-label={`${family} reference swatch`}
              style={{ backgroundColor: getColorHex(family) }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
