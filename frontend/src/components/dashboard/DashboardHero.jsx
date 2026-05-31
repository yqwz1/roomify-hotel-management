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
        'roomify-luxe-gradient roomify-hover-glow relative overflow-hidden rounded-[2rem] border border-white/12 px-6 py-7 text-white shadow-[0_38px_100px_-46px_rgba(6,22,34,0.98)] sm:px-8 sm:py-8',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_25%),radial-gradient(circle_at_20%_85%,rgba(214,168,79,0.28),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_44%)]" />
      <div className="pointer-events-none absolute -end-16 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-[1px]" />
      <div className="pointer-events-none absolute -bottom-32 start-10 h-80 w-80 rounded-full border border-white/10 bg-brand-gold/10" />

      <div className={cn('relative flex min-w-0 flex-col gap-6 xl:flex-row xl:justify-between', desktopAlignClass)}>
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <p className="break-words text-xs font-black uppercase tracking-[0.28em] text-brand-champagne/80">
              {eyebrow}
            </p>
          )}

          <h2 className="mt-3 max-w-4xl break-words font-heading text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl break-words text-base font-medium leading-7 text-white/82 sm:text-[1.12rem]">
            {description}
          </p>

          {meta.length > 0 && (
            <div className="mt-5 flex min-w-0 flex-wrap gap-2.5">
              {meta.map((item) => (
                <span
                  key={item}
                  className="max-w-full shrink-0 truncate rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/88 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {children && (
          <div className="relative min-w-0 w-full max-w-md xl:w-auto">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
