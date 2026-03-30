import { cn } from '../../lib/utils';

export default function DashboardHero({
  eyebrow,
  title,
  description,
  meta = [],
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(135deg,#201812_0%,#34261a_42%,#6f4a24_100%)] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(32,24,18,0.75)] sm:px-8 sm:py-8',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_24%)]" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-200/80">
              {eyebrow}
            </p>
          )}

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/72 sm:text-base">
            {description}
          </p>

          {meta.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur"
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
