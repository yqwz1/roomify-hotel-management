import { Info } from 'lucide-react';
import Reveal from '../motion/Reveal';

/**
 * Roadmap preview disclosure — used on marketing pages where the displayed
 * content reflects intent / a student-built proof of concept, not a live
 * commercial offering. Pass a page-specific `note` to tailor the second line.
 */
export default function RoadmapBanner({
  title = 'Details on this page reflect our roadmap, not a live commercial offering.',
  note = "Roomify is a student-built PMS. What you see here illustrates the direction the platform is heading — talk to us and we'll be transparent about what's wired up today vs. what's planned.",
  inline = false,
}) {
  const card = (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-amber-50/60 to-transparent px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200">
            <Info className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">
                Roadmap preview
              </span>
              <p className="text-sm font-black tracking-tight text-zinc-950">{title}</p>
            </div>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-zinc-600">{note}</p>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl"
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
