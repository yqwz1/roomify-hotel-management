import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DashboardQuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  tone = 'light',
}) {
  const toneStyles = tone === 'dark'
    ? {
        wrapper: 'border-white/10 bg-white/5 text-white hover:bg-white/10',
        iconWrap: 'bg-white/10 text-white',
        description: 'text-brand-ink-hint',
        arrow: 'text-brand-ink-muted group-hover:text-white',
      }
    : {
        wrapper: 'border-brand-surface-border bg-brand-surface-light text-brand-ink hover:border-brand-surface-border hover:bg-white',
        iconWrap: 'bg-white text-brand-ink shadow-sm',
        description: 'text-brand-ink-muted',
        arrow: 'text-brand-ink-hint group-hover:text-brand-ink',
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between rounded-[1.5rem] border p-4 text-start transition-all duration-200',
        toneStyles.wrapper
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl', toneStyles.iconWrap)}>
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 space-y-1">
          <p
            dir="auto"
            className="text-sm font-bold leading-tight [unicode-bidi:plaintext]"
          >
            {title}
          </p>
          <p
            dir="auto"
            className={cn(
              'text-xs font-medium leading-relaxed [overflow-wrap:anywhere] [unicode-bidi:plaintext]',
              toneStyles.description
            )}
          >
            {description}
          </p>
        </div>
      </div>

      <ArrowRight className={cn('h-4 w-4 flex-shrink-0 transition-colors', toneStyles.arrow)} />
    </button>
  );
}
