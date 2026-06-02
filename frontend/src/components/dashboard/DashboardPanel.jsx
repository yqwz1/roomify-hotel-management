import { cn } from '../../lib/utils';

export default function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}) {
  return (
    <section className={cn('motion-slide-up min-w-0 rounded-[1.75rem] border border-brand-surface-border bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)]', className)}>
      <div className="flex min-w-0 flex-col gap-3 border-b border-brand-surface-border px-5 py-5 sm:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-lg font-black tracking-tight text-brand-ink">{title}</h3>
            {description && (
              <p className="mt-1 break-words text-sm font-medium leading-6 text-brand-ink-muted">{description}</p>
            )}
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>

      <div className={cn('min-w-0 px-5 py-5 sm:px-6', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
