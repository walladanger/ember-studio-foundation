import { render, screen } from '@testing-library/react';
import { App } from './App';

test('renders the Ember Studio foundation root', () => {
  render(<App />);
  expect(screen.getByText('Ember Studio')).toBeInTheDocument();
});
