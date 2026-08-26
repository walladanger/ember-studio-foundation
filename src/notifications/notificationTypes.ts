export type NotificationKind = 'success' | 'info' | 'warning' | 'error' | 'loading' | 'progress';

export interface NotificationInput {
  kind: NotificationKind;
  title: string;
  description?: string;
  progress?: number;
}

export interface Notification extends NotificationInput {
  id: string;
}

export interface NotificationApi {
  notifications: readonly Notification[];
  notify(input: NotificationInput): string;
  dismiss(id: string): void;
}
