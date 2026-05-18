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
        'theme-hero-surface relative overflow-hidden rounded-[2rem] border px-6 py-7 text-white sm:px-8 sm:py-8',
        className
      )}
    >
      <div className="theme-hero-overlay pointer-events-none absolute inset-0" />

      <div className={cn('relative flex flex-col gap-6 xl:flex-row xl:justify-between', desktopAlignClass)}>
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
              {eyebrow}
            </p>
          )}

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-zinc-300 sm:text-[1.15rem]">
            {description}
          </p>

          {meta.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="theme-hero-chip rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {children && (
          <div className="relative w-full max-w-md xl:w-auto">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
