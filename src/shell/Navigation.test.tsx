import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

test('collapses navigation and keeps icon labels accessible', async () => {
  const user = userEvent.setup();
  render(<AppShell />);

  await user.click(screen.getByRole('button', { name: /collapse navigation/i }));

  expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed', 'true');
  expect(screen.getByRole('button', { name: 'Files' })).toBeInTheDocument();
});
