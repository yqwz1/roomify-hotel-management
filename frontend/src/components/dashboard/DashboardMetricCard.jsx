import { cn } from '../../lib/utils';

export default function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'light',
  valueDirection = 'auto',
  valueWrap = 'break',
  valueClassName = '',
  hintClassName = '',
  labelClassName = '',
  cardClassName = '',
}) {
  const toneStyles = tone === 'dark'
    ? {
        card: 'border-white/10 bg-brand-primary text-white shadow-[0_20px_50px_-26px_rgba(0,0,0,0.9)]',
        icon: 'bg-white/10 text-white',
        label: '!text-white',
        hint: '!text-white',
        value: '!text-white',
      }
    : {
        card: 'border-brand-surface-border bg-white text-brand-ink shadow-[0_18px_40px_-30px_rgba(38,75,107,0.18)]',
        icon: 'bg-brand-primary-tint text-brand-ink',
        label: 'text-brand-ink-muted',
        hint: 'text-brand-ink-hint',
        value: 'text-brand-ink',
      };

  return (
    <div className={cn('relative min-w-0 overflow-hidden rounded-[1.75rem] border p-5 sm:p-6', toneStyles.card, cardClassName)}>
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={cn('break-words text-xs font-black uppercase leading-5 tracking-[0.22em]', toneStyles.label, labelClassName)}>
            {label}
          </p>
          <p
            className={cn(
              'mt-3 text-2xl font-black tracking-tight sm:text-[2rem]',
              valueWrap === 'nowrap' ? 'whitespace-nowrap' : 'break-words [overflow-wrap:anywhere]',
              toneStyles.value,
              valueClassName
            )}
          >
          <span dir={valueDirection} className="inline-block max-w-full [unicode-bidi:isolate]">
            {value}
          </span>
          </p>
          {hint && (
            <p className={cn('mt-2 break-words text-sm font-medium', toneStyles.hint, hintClassName)}>
              {hint}
            </p>
          )}
        </div>

        <span className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl', toneStyles.icon)}>
          <Icon className="h-5 w-5 shrink-0" />
        </span>
      </div>
    </div>
  );
}
