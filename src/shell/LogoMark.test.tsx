import { render, screen } from '@testing-library/react';
import { LogoMark } from './LogoMark';

test('renders an SVG with role="img" and default aria-label', () => {
  render(<LogoMark />);

  const svg = screen.getByRole('img', { name: 'Ember Studio' });
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveClass('logo-mark');
  expect(svg.tagName).toBe('svg');
});

test('renders an SVG with a custom title as aria-label', () => {
  render(<LogoMark title="Custom Studio Logo" />);

  const svg = screen.getByRole('img', { name: 'Custom Studio Logo' });
  expect(svg).toBeInTheDocument();
  expect(svg.tagName).toBe('svg');
});
