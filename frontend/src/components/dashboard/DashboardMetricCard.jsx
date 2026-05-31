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
        card: 'border-white/10 bg-[linear-gradient(135deg,#061622_0%,#073B4C_48%,#0E7C7B_100%)] text-white shadow-[0_28px_72px_-34px_rgba(6,22,34,0.95)]',
        icon: 'bg-white/12 text-brand-champagne ring-1 ring-white/15',
        label: '!text-white',
        hint: '!text-white',
        value: '!text-white',
      }
    : {
        card: 'border-brand-surface-border bg-[linear-gradient(145deg,#ffffff_0%,#FFF9EE_72%,#D7F7F1_150%)] text-brand-ink shadow-[0_20px_48px_-32px_rgba(7,59,76,0.42)]',
        icon: 'bg-brand-primary-tint text-brand-primary-deep shadow-sm ring-1 ring-brand-primary/15',
        label: 'text-brand-ink-muted',
        hint: 'text-brand-ink-hint',
        value: 'text-brand-ink',
      };

  return (
    <div className={cn('roomify-card-interactive relative min-w-0 overflow-hidden rounded-[1.75rem] border p-5 sm:p-6', toneStyles.card, cardClassName)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.58),transparent_12rem),radial-gradient(circle_at_bottom_left,rgba(214,168,79,0.12),transparent_11rem)]" />
      <div className="relative flex min-w-0 items-start justify-between gap-4">
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
