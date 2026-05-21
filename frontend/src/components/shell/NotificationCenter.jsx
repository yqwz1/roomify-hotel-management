import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import EmptyState from '../common/EmptyState';
import {
  extractNotificationError,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '../../services/notificationService';
import {
  formatLocalizedDateTime,
  translateWithFallback,
} from '../../utils/localization';

const POLL_INTERVAL_MS = 15000;

export default function NotificationCenter() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [notifications]
  );

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [items, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(Number(count ?? 0));
      setError('');
    } catch (err) {
      setError(extractNotificationError(err));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      loadNotifications({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const updated = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? updated : notification))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(extractNotificationError(err));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-surface-border bg-white text-brand-ink shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary-deep"
          aria-label={translateWithFallback(t, 'notifications.button', 'Open notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -end-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-danger px-1.5 text-[10px] font-black text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[24rem] rounded-[1.5rem] border-brand-surface-border bg-white p-0 shadow-[0_20px_48px_-28px_rgba(15,23,42,0.26)]">
        <div className="border-b border-brand-surface-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint">
                {translateWithFallback(t, 'notifications.live', 'Live updates')}
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-brand-ink">
                {translateWithFallback(t, 'notifications.title', 'Notifications')}
              </h3>
            </div>
            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-muted">
              {translateWithFallback(t, 'notifications.unread', '{{count}} unread', { count: unreadCount })}
            </span>
          </div>
        </div>

        <div className="max-h-[26rem] overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="px-2 py-6 text-sm font-medium text-brand-ink-muted">
              {translateWithFallback(t, 'notifications.loading', 'Loading notifications...')}
            </p>
          ) : error ? (
            <p className="rounded-[1.15rem] border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
              {error}
            </p>
          ) : sortedNotifications.length === 0 ? (
            <EmptyState
              title={translateWithFallback(t, 'notifications.emptyTitle', 'No notifications yet')}
              message={translateWithFallback(t, 'notifications.emptyMessage', 'New updates will appear here automatically.')}
              icon={Bell}
            />
          ) : (
            <div className="space-y-3">
              {sortedNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-[1.25rem] border px-4 py-4 transition ${
                    notification.read
                      ? 'border-brand-surface-border bg-brand-surface-light/70'
                      : 'border-brand-primary/20 bg-brand-primary/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-brand-ink">{notification.title}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-ink-muted">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-full border-brand-surface-border px-3 text-xs font-bold"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                        {translateWithFallback(t, 'notifications.markRead', 'Mark read')}
                      </Button>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    {formatLocalizedDateTime(notification.createdAt, i18n.language)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
