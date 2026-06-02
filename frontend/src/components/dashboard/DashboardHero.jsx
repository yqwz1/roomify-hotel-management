import { cn } from '../../lib/utils';

export default function DashboardHero({
  eyebrow,
  title,
  description,
  meta = [],
  children,
  className,
  desktopAlign = 'end',
}) {
  const desktopAlignClass = desktopAlign === 'start' ? 'xl:items-start' : 'xl:items-end';

  return (
    <section
      className={cn(
        'motion-slide-up-strong relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#1A2B3A_0%,#264B6B_52%,#1A2B3A_100%)] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] sm:px-8 sm:py-8',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(161,161,170,0.14),transparent_28%)]" />

      <div className={cn('relative flex min-w-0 flex-col gap-6 xl:flex-row xl:justify-between', desktopAlignClass)}>
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <p className="break-words text-xs font-black uppercase tracking-[0.3em] text-white/65">
              {eyebrow}
            </p>
          )}

          <h2 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl break-words text-base font-medium leading-7 text-white/80 sm:text-[1.15rem]">
            {description}
          </p>

          {meta.length > 0 && (
            <div className="mt-5 flex min-w-0 flex-wrap gap-2.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="max-w-full shrink-0 truncate rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {children && (
          <div className="relative min-w-0 w-full max-w-md sm:max-w-lg md:max-w-xl xl:max-w-xl xl:w-auto">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
