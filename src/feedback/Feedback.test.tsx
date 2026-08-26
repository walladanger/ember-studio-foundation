import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { EmptyState, InlineValidation, LoadingState, ProgressState, SuccessState, WarningState } from './Feedback';

test('renders semantic loading, progress, empty, success, warning, and validation feedback', () => {
  render(
    <>
      <LoadingState label="Loading document" />
      <ProgressState label="Saving" value={60} />
      <EmptyState title="No files" description="Open a text document to begin." />
      <SuccessState title="Saved" />
      <WarningState title="Unsaved changes" />
      <InlineValidation id="title-error">A title is required.</InlineValidation>
    </>,
  );

  expect(screen.getByRole('status', { name: 'Loading document' })).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Saving' })).toHaveAttribute('aria-valuenow', '60');
  expect(screen.getByText('No files')).toBeInTheDocument();
  expect(screen.getByText('Saved')).toBeInTheDocument();
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  expect(screen.getByText('A title is required.')).toHaveAttribute('id', 'title-error');
});
