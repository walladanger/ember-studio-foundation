export interface LogoMarkProps {
  title?: string;
}

export function LogoMark({ title = 'Ember Studio' }: LogoMarkProps) {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 28 32"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path d="M15.8 1.5c.7 5.3-2.6 7.9-5 10.6-1.8 2-2.8 4-2.8 6.5 0 3.7 2.7 6.6 6.3 6.6 3.9 0 6.7-2.9 6.7-7.1 0-2.6-1.2-5.4-4.1-8.4 4.5 2.8 7.6 7.2 7.6 12.4C24.5 28 20.2 32 14 32 7.3 32 2.5 27.3 2.5 21.1 2.5 13.8 8.2 9 15.8 1.5Zm-2.7 14.3c-1.5 1.7-2.3 3.1-2.3 4.8 0 1.8 1.3 3.2 3.1 3.2 1.9 0 3.3-1.5 3.3-3.5 0-1.3-.6-2.7-2-4.4l-2.1 3.5Z" />
    </svg>
  );
}
