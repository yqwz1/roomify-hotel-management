import { cn } from '../../lib/utils';

export default function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'light',
  valueDirection = 'auto',
  valueWrap = 'break',
}) {
  const toneStyles = tone === 'dark'
    ? {
        card: 'border-white/10 bg-zinc-950 text-white shadow-[0_20px_50px_-26px_rgba(0,0,0,0.9)]',
        icon: 'bg-white/10 text-white',
        label: '!text-white',
        hint: '!text-white',
        value: '!text-white',
      }
    : {
        card: 'border-black/5 bg-white text-zinc-950 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]',
        icon: 'bg-zinc-100 text-zinc-950',
        label: 'text-zinc-500',
        hint: 'text-zinc-400',
        value: 'text-zinc-950',
      };

  return (
    <div className={cn('relative overflow-hidden rounded-[1.75rem] border p-5 sm:p-6', toneStyles.card)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-xs font-black uppercase tracking-[0.22em] leading-5', toneStyles.label)}>
            {label}
          </p>
          <p
            className={cn(
              'mt-3 text-2xl font-black tracking-tight sm:text-[2rem]',
              valueWrap === 'nowrap' ? 'whitespace-nowrap' : 'break-words',
              toneStyles.value
            )}
          >
            <span dir={valueDirection} className="inline-block [unicode-bidi:isolate]">
              {value}
            </span>
          </p>
          {hint && (
            <p className={cn('mt-2 break-words text-sm font-medium', toneStyles.hint)}>
              {hint}
            </p>
          )}
        </div>

        <span className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl', toneStyles.icon)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="pointer-events-none absolute -bottom-9 -end-8 h-24 w-24 rounded-full border-[14px] border-black/5 opacity-40" />
    </div>
  );
}
