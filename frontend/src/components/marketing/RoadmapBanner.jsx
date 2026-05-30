import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Reveal from '../motion/Reveal';

/**
 * Roadmap preview disclosure. Pass a translation `tone` ("default" | "pricing" |
 * "compliance" | "integrations") to localise the title + note, or pass raw
 * `title` / `note` props to override.
 */
export default function RoadmapBanner({
  tone = 'default',
  title,
  note,
  inline = false,
}) {
  const { t } = useTranslation();

  const resolvedTitle = title ?? t(`roadmap.${tone}.title`, { defaultValue: t('roadmap.titleDefault') });
  const resolvedNote = note ?? t(`roadmap.${tone}.note`, { defaultValue: t('roadmap.noteDefault') });

  const card = (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-brand-warning/30 bg-gradient-to-r from-brand-warning/10 via-brand-warning/[0.04] to-transparent px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex min-w-0 h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-warning/15 ring-1 ring-brand-warning/30">
            <Info className="h-4 w-4 text-brand-warning shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex min-w-0 items-center rounded-full bg-brand-warning/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-warning break-words">
                {t('roadmap.badge')}
              </span>
              <p className="text-sm font-black tracking-tight text-brand-ink break-words">{resolvedTitle}</p>
            </div>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-brand-ink-muted break-words">{resolvedNote}</p>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-warning/30 blur-2xl rtl:right-auto rtl:-left-10"
        />
      </div>
    </Reveal>
  );

  if (inline) return card;

  return (
    <section>
      <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 lg:px-10">{card}</div>
    </section>
  );
}
