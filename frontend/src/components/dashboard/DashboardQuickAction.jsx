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
        description: 'text-zinc-300',
        arrow: 'text-zinc-500 group-hover:text-white',
      }
    : {
        wrapper: 'border-zinc-200 bg-zinc-50 text-zinc-950 hover:border-zinc-300 hover:bg-white',
        iconWrap: 'bg-white text-zinc-950 shadow-sm',
        description: 'text-zinc-500',
        arrow: 'text-zinc-300 group-hover:text-zinc-950',
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

        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className={cn('mt-1 text-xs font-medium', toneStyles.description)}>
            {description}
          </p>
        </div>
      </div>

      <ArrowRight className={cn('h-4 w-4 flex-shrink-0 transition-colors', toneStyles.arrow)} />
    </button>
  );
}
