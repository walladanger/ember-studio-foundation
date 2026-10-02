import { buildAccentTokens, getColorFamilies } from './colorProfiles';

test('maps the selected Tailwind family and shade to semantic accent tokens', () => {
  const tokens = buildAccentTokens({ family: 'sky', shade: 400 });
  const sky400 = 'oklch(74.6% 0.16 232.661)';

  expect(tokens.accent).toBe(sky400);
  expect(tokens.accentSoft).toContain(sky400);
  expect(tokens.focusRing).toBe(tokens.accent);
});

test('does not expose excluded Tailwind utility colors as accent families', () => {
  expect(getColorFamilies()).not.toEqual(
    expect.arrayContaining(['inherit', 'current', 'transparent']),
  );
});
