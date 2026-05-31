import { useEffect, useState } from 'react';
import { CheckCircle2, Palette, Sparkles, Wand2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { Button } from '@/components/ui/button';
import { useTheme } from '../theme/ThemeProvider';
import { EASE } from '../components/motion/Reveal';

export default function Settings() {
  const { themeId, selectedTheme, themes, setThemeId } = useTheme();
  const [savedThemeName, setSavedThemeName] = useState('');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!savedThemeName) return undefined;
    const timer = window.setTimeout(() => setSavedThemeName(''), 2200);
    return () => window.clearTimeout(timer);
  }, [savedThemeName]);

  const handleThemeSelect = (nextThemeId) => {
    const nextTheme = themes.find((theme) => theme.id === nextThemeId);
    setThemeId(nextThemeId);
    setSavedThemeName(nextTheme?.name ?? '');
  };

  return (
    <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow="Personal workspace"
        title="Settings"
        description="Shape Roomify around your presentation mood. Theme changes preview instantly, persist locally, and recolor the whole app shell."
        meta={['5 visual themes', 'Instant preview', 'Saved on this device']}
      >
        <div className="roomify-glass-dark overflow-hidden rounded-[1.75rem] p-5">
          <div className="relative h-40 overflow-hidden rounded-[1.25rem] border border-white/12 bg-white/10">
            <div className="absolute inset-0 roomify-luxe-gradient" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_8rem),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_9rem)]" />
            <motion.div
              aria-hidden="true"
              className="absolute left-8 top-8 h-16 w-16 rounded-full border border-white/25 bg-white/10 blur-[1px]"
              animate={reduceMotion ? {} : { y: [0, 12, 0], x: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute bottom-8 right-8 h-12 w-12 rounded-full bg-brand-gold/70 shadow-[0_0_42px_rgba(255,255,255,0.35)]"
              animate={reduceMotion ? {} : { scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-champagne/80">
                Active theme
              </p>
              <p className="mt-1 text-lg font-black text-white">{selectedTheme.name}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title="Appearance"
        description="Choose a visual direction for dashboards, booking, payment, navigation, and public pages."
        action={
          savedThemeName ? (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary-tint px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-brand-primary-deep"
              role="status"
            >
              <CheckCircle2 className="h-4 w-4" />
              {savedThemeName} applied
            </motion.span>
          ) : null
        }
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {themes.map((theme, index) => {
            const isSelected = theme.id === themeId;
            return (
              <motion.button
                key={theme.id}
                type="button"
                onClick={() => handleThemeSelect(theme.id)}
                className={`roomify-hover-glow group relative min-w-0 overflow-hidden rounded-[1.6rem] border p-4 text-start focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-focus ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary-tint shadow-[0_22px_60px_-34px_rgb(var(--brand-primary-rgb)/0.9)]'
                    : 'border-brand-surface-border bg-white/78 hover:border-brand-primary/45'
                }`}
                aria-pressed={isSelected}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, delay: index * 0.045, ease: EASE }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              >
                <div
                  className="relative h-28 overflow-hidden rounded-[1.1rem] border border-white/40 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 45%, ${theme.preview[2]} 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.45),transparent_4.5rem),radial-gradient(circle_at_84%_76%,rgba(255,255,255,0.22),transparent_5rem)]" />
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/18 bg-white/12 p-2 backdrop-blur">
                    <div className="flex items-center gap-1.5">
                      {theme.preview.map((color) => (
                        <span
                          key={color}
                          className="h-3.5 w-3.5 rounded-full border border-white/55"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="roomify-success-burst absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-primary shadow-lg">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-brand-ink">{theme.name}</p>
                    <p className="mt-1 break-words text-sm font-medium leading-6 text-brand-ink-muted">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-brand-cta">
                <Palette className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-lagoon">
                  Theme scope
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">
                  The selected theme updates page backgrounds, navigation, cards, buttons, focus rings,
                  hero gradients, glow effects, and mobile navigation accents.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handleThemeSelect('roomify-premium')}
            className="h-auto min-h-16 rounded-[1.5rem] px-6 text-sm"
          >
            <Wand2 className="h-4 w-4" />
            Reset to premium
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </DashboardPanel>
    </div>
  );
}
