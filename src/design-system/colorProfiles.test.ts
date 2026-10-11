import { buildAccentTokens, getColorFamilies, getColorValue } from './colorProfiles';

test('maps the selected Tailwind family and shade to semantic accent tokens', () => {
  const tokens = buildAccentTokens({ family: 'sky', shade: 400 });
  const sky400 = getColorValue('sky', 400);

  expect(tokens.accent).toBe(sky400);
  expect(tokens.accentSoft).toBe(`color-mix(in oklab, ${sky400} 15%, transparent)`);
  expect(tokens.selectedBackground).toBe(`color-mix(in oklab, ${sky400} 12%, transparent)`);
  expect(tokens.focusRing).toBe(tokens.accent);
});

test('does not expose excluded Tailwind utility colors as accent families', () => {
  expect(getColorFamilies()).not.toEqual(
    expect.arrayContaining(['inherit', 'current', 'transparent']),
  );
});
