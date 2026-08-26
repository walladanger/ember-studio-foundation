import { fireEvent, render, screen } from '@testing-library/react';
import { ColorProfilePopover } from './ColorProfilePopover';

test('selects a Tailwind family and shade from the compact profile picker', () => {
  const onChange = vi.fn();

  render(
    <ColorProfilePopover
      value={{ family: 'sky', shade: 400 }}
      onChange={onChange}
      onClose={vi.fn()}
    />,
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Slate Blue')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /cyan-400/i }));

  expect(onChange).toHaveBeenCalledWith({ family: 'cyan', shade: 400 });
});
