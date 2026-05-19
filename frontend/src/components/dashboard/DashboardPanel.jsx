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
    <section className={cn('rounded-[1.75rem] border border-brand-surface-border bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)]', className)}>
      <div className="flex flex-col gap-3 border-b border-brand-surface-border px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-brand-ink">{title}</h3>
            {description && (
              <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted">{description}</p>
            )}
          </div>

          {action}
        </div>
      </div>

      <div className={cn('px-5 py-5 sm:px-6', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
