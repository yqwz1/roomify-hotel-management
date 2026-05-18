import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck2,
  QrCode,
  Lock,
  KeyRound,
  ScrollText,
  Database,
  ArrowRight,
  Check,
} from 'lucide-react';
import Footer from '../components/Footer';
import Reveal, { EASE } from '../components/motion/Reveal';
import RoadmapBanner from '../components/marketing/RoadmapBanner';

const PILLARS = [
  { id: 'zatca', icon: ShieldCheck, accent: 'border-brand-success/25 bg-brand-success/[0.06]', iconBg: 'bg-brand-success' },
  { id: 'vat', icon: FileCheck2, accent: 'border-brand-warning/25 bg-brand-warning/[0.06]', iconBg: 'bg-brand-warning' },
  { id: 'payment', icon: Lock, accent: 'border-brand-surface-border bg-brand-surface-light', iconBg: 'bg-brand-ink' },
  { id: 'rbac', icon: KeyRound, accent: 'border-brand-surface-border bg-brand-surface-light', iconBg: 'bg-brand-ink' },
];

const STANDARD_IDS = ['zatca', 'vat', 'pci', 'gdpr', 'iso', 'residency'];

const RESIDENCY_POINTS = ['p1', 'p2', 'p3', 'p4'];

export default function Compliance() {
  const { t } = useTranslation();
  return (
    <div className="min-h-full bg-brand-surface">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-success/20 to-transparent blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, 12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-success/30 bg-brand-success/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-success shadow-sm"
          >
            <ShieldCheck className="h-3 w-3" />
            {t('m.compliance.eyebrow')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-brand-ink sm:text-[2.6rem]"
          >
            {t('m.compliance.headline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-2xl text-[0.95rem] font-medium leading-relaxed text-brand-ink-muted"
          >
            {t('m.compliance.bio')}
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner tone="compliance" inline />
          </div>

          {/* Sample invoice card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
            className="mt-10 grid gap-5 sm:grid-cols-[1.3fr_1fr]"
          >
            <div className="rounded-[1.75rem] border border-brand-surface-border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-ink-hint">{t('m.compliance.invoice.label')}</p>
                  <p className="mt-1 text-sm font-black text-brand-ink">{t('m.compliance.invoice.hotel')}</p>
                  <p className="text-[11px] font-medium text-brand-ink-muted" dir="ltr">{t('m.compliance.invoice.trn')}</p>
                </div>
                <div className="rounded-2xl border border-brand-surface-border bg-brand-primary p-2.5">
                  <QrCode className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="mt-5 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-brand-ink-muted"><span>{t('m.compliance.invoice.lineRoom')}</span><span className="font-mono" dir="ltr">1,200.00</span></div>
                <div className="flex justify-between text-brand-ink-muted"><span>{t('m.compliance.invoice.lineFB')}</span><span className="font-mono" dir="ltr">185.00</span></div>
                <div className="flex justify-between text-brand-ink-hint text-xs"><span>{t('m.compliance.invoice.subtotal')}</span><span className="font-mono" dir="ltr">1,385.00</span></div>
                <div className="flex justify-between text-brand-ink-hint text-xs"><span>{t('m.compliance.invoice.vat')}</span><span className="font-mono" dir="ltr">207.75</span></div>
                <div className="mt-2 flex justify-between border-t border-brand-surface-border pt-2 text-sm font-black text-brand-ink">
                  <span>{t('m.compliance.invoice.total')}</span><span className="font-mono" dir="ltr">1,592.75</span>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-brand-ink-hint">{t('m.compliance.invoice.signed')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <Reveal className="rounded-2xl border border-brand-success/25 bg-brand-success/[0.06] p-4">
                <ShieldCheck className="h-5 w-5 text-brand-success" />
                <p className="mt-3 text-sm font-black text-brand-ink">{t('m.compliance.cleared.title')}</p>
                <p className="mt-1 text-[12px] font-medium text-brand-success">{t('m.compliance.cleared.sub')}</p>
              </Reveal>
              <Reveal delay={0.1} className="rounded-2xl border border-brand-warning/25 bg-brand-warning/[0.06] p-4">
                <FileCheck2 className="h-5 w-5 text-brand-warning" />
                <p className="mt-3 text-sm font-black text-brand-ink">{t('m.compliance.vatcard.title')}</p>
                <p className="mt-1 text-[12px] font-medium text-brand-warning">{t('m.compliance.vatcard.sub')}</p>
              </Reveal>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
          <Reveal as="p" className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">{t('m.compliance.pillarsEyebrow')}</Reveal>
          <Reveal as="h2" delay={0.08} className="mt-1.5 max-w-xl text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
            {t('m.compliance.pillarsTitle')}
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
            className="mt-8 grid gap-5 lg:grid-cols-2"
          >
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.65, ease: EASE }}
                  whileHover={{ y: -4 }}
                  className={`rounded-[1.75rem] border p-6 transition-shadow hover:shadow-lg ${p.accent}`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${p.iconBg} text-white shadow-sm`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="mt-4 text-base font-black tracking-tight text-brand-ink">{t(`m.compliance.pillar.${p.id}.title`)}</h3>
                  <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-brand-ink-muted">{t(`m.compliance.pillar.${p.id}.desc`)}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-1.5">
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n} className="flex items-start gap-1.5 text-[12px] font-semibold text-brand-ink">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-ink-muted" />
                        {t(`m.compliance.pillar.${p.id}.b${n}`)}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* STANDARDS GRID */}
      <section className="border-t border-brand-surface-border bg-brand-surface">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <Reveal as="p" className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">{t('m.compliance.standardsEyebrow')}</Reveal>
          <Reveal as="h2" delay={0.08} className="mt-1.5 text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
            {t('m.compliance.standardsTitle')}
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
            }}
            className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {STANDARD_IDS.map((id) => (
              <motion.div
                key={id}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: EASE }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-start gap-1 rounded-2xl border border-brand-surface-border bg-white px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <ScrollText className="h-4 w-4 text-brand-ink-hint" />
                <p className="text-sm font-black text-brand-ink">{t(`m.compliance.standard.${id}.label`)}</p>
                <p className="text-[10px] font-medium text-brand-ink-muted">{t(`m.compliance.standard.${id}.sub`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DATA RESIDENCY */}
      <section className="border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">{t('m.compliance.residencyEyebrow')}</p>
              <h2 className="mt-1.5 max-w-md text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
                {t('m.compliance.residencyTitle')}
              </h2>
              <p className="mt-3 max-w-md text-[14px] font-medium leading-relaxed text-brand-ink-muted">
                {t('m.compliance.residencyBio')}
              </p>
              <Link
                to="/demo"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary-deep"
              >
                {t('m.compliance.residencyCta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Reveal>
            <Reveal delay={0.1} variant="scale">
              <div className="rounded-[1.75rem] border border-brand-surface-border bg-brand-surface-light p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-ink">{t('m.compliance.residency.region')}</p>
                    <p className="text-[12px] font-medium text-brand-ink-muted">{t('m.compliance.residency.regionSub')}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-[13px] text-brand-ink">
                  {RESIDENCY_POINTS.map((p) => (
                    <div key={p} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-success" />
                      <span>{t(`m.compliance.residency.${p}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
