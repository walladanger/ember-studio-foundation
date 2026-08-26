import { buildAccentTokens, getColorFamilies } from './colorProfiles';

test('maps the selected Tailwind family and shade to semantic accent tokens', () => {
  const tokens = buildAccentTokens({ family: 'sky', shade: 400 });

  expect(tokens.accent).toBe('#38bdf8');
  expect(tokens.accentSoft).toContain('38bdf8');
  expect(tokens.focusRing).toBe(tokens.accent);
});

test('does not expose excluded Tailwind utility colors as accent families', () => {
  expect(getColorFamilies()).not.toEqual(
    expect.arrayContaining(['inherit', 'current', 'transparent']),
  );
});
