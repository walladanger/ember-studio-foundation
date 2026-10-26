import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';

test('renders default "Foundation ready" text in a contentinfo role', () => {
  render(<StatusBar />);

  const footer = screen.getByRole('contentinfo');
  expect(footer).toBeInTheDocument();
  expect(footer).toHaveTextContent('Foundation ready');
  expect(footer).toHaveClass('status-bar');
});

test('renders custom children in a contentinfo role', () => {
  render(
    <StatusBar>
      <span>Custom Status</span>
      <button>Action</button>
    </StatusBar>
  );

  const footer = screen.getByRole('contentinfo');
  expect(footer).toBeInTheDocument();
  expect(screen.getByText('Custom Status')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
});
