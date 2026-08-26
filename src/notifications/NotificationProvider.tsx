import { X } from 'lucide-react';
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { Notification, NotificationApi, NotificationInput } from './notificationTypes';
import './notifications.css';

const NotificationContext = createContext<NotificationApi | null>(null);
let nextNotificationId = 0;

export function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<readonly Notification[]>([]);
  const value = useMemo<NotificationApi>(() => ({
    notifications,
    notify(input: NotificationInput) {
      const id = `notification-${++nextNotificationId}`;
      setNotifications((current) => [...current, { ...input, id }]);
      return id;
    },
    dismiss(id) {
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    },
  }), [notifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <aside className="notification-region" aria-label="Notifications">
        {notifications.map((notification) => (
          <div
            className={`notification notification--${notification.kind}`}
            key={notification.id}
            role={notification.kind === 'error' ? 'alert' : 'status'}
            aria-live={notification.kind === 'error' ? 'assertive' : 'polite'}
          >
            <div className="notification__content">
              <strong>{notification.title}</strong>
              {notification.description ? <p>{notification.description}</p> : null}
              {notification.kind === 'progress' ? (
                <div
                  className="notification__progress"
                  role="progressbar"
                  aria-label={notification.title}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.max(0, Math.min(100, notification.progress ?? 0))}
                >
                  <span style={{ width: `${Math.max(0, Math.min(100, notification.progress ?? 0))}%` }} />
                  <em>{notification.progress ?? 0}%</em>
                </div>
              ) : null}
            </div>
            <button type="button" aria-label={`Dismiss ${notification.title}`} onClick={() => value.dismiss(notification.id)}>
              <X aria-hidden="true" size={15} />
            </button>
          </div>
        ))}
      </aside>
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationApi {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider.');
  return context;
}
