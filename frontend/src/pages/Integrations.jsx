import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Globe2,
  Receipt,
  MessageCircle,
  ArrowRight,
  Plug,
  Workflow,
  Shield,
} from 'lucide-react';
import Footer from '../components/Footer';
import Reveal, { EASE } from '../components/motion/Reveal';
import RoadmapBanner from '../components/marketing/RoadmapBanner';

/* Brand names render as-is in both locales. Only the tag is localised. */
const CATEGORIES = [
  {
    id: 'payments',
    icon: CreditCard,
    integrations: [
      { name: 'Mada', tagKey: 'localSA' },
      { name: 'STC Pay', tagKey: 'wallet' },
      { name: 'HyperPay', tagKey: 'gateway' },
      { name: 'PayTabs', tagKey: 'gateway' },
      { name: 'Stripe', tagKey: 'international' },
      { name: 'Apple Pay', tagKey: 'wallet' },
    ],
  },
  {
    id: 'ota',
    icon: Globe2,
    integrations: [
      { name: 'Booking.com', tagKey: 'ota' },
      { name: 'Expedia', tagKey: 'ota' },
      { name: 'Airbnb', tagKey: 'ota' },
      { name: 'Almosafer', tagKey: 'localOta' },
      { name: 'Agoda', tagKey: 'ota' },
      { name: 'SiteMinder', tagKey: 'channelMgr' },
    ],
  },
  {
    id: 'finance',
    icon: Receipt,
    integrations: [
      { name: 'ZATCA Fatoora', tagKey: 'einvoicing' },
      { name: 'QuickBooks', tagKey: 'accounting' },
      { name: 'Zoho Books', tagKey: 'accounting' },
      { name: 'Xero', tagKey: 'accounting' },
      { name: 'SAP Business One', tagKey: 'erp' },
    ],
  },
  {
    id: 'comms',
    icon: MessageCircle,
    integrations: [
      { name: 'WhatsApp Business', tagKey: 'messaging' },
      { name: 'Unifonic', tagKey: 'sms' },
      { name: 'Twilio', tagKey: 'smsVoice' },
      { name: 'SendGrid', tagKey: 'email' },
    ],
  },
];

const STORY = [
  { id: 'plug', icon: Plug },
  { id: 'sync', icon: Workflow },
  { id: 'token', icon: Shield },
];

export default function Integrations() {
  const { t } = useTranslation();
  return (
    <div className="min-h-full bg-brand-surface">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-primary-tint/50 to-transparent blur-3xl"
          animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-ink-muted shadow-sm"
          >
            <Plug className="h-3 w-3" />
            {t('m.integrations.eyebrow')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-brand-ink sm:text-[2.6rem]"
          >
            {t('m.integrations.headline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-2xl text-[0.95rem] font-medium leading-relaxed text-brand-ink-muted"
          >
            {t('m.integrations.bio')}
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner tone="integrations" inline />
          </div>

          {/* Story strip */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
            }}
            className="mt-9 grid gap-3 sm:grid-cols-3"
          >
            {STORY.map(({ id, icon: Icon }) => (
              <motion.div
                key={id}
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.55, ease: EASE }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-brand-surface-border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primary-tint text-brand-ink">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <p className="mt-3 text-sm font-black text-brand-ink">{t(`m.integrations.story.${id}.title`)}</p>
                <p className="mt-1 text-[12px] font-medium leading-snug text-brand-ink-muted">{t(`m.integrations.story.${id}.desc`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16 space-y-14">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id}>
                <Reveal>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-brand-ink">{t(`m.integrations.cats.${cat.id}.title`)}</h2>
                      <p className="text-[13px] font-medium text-brand-ink-muted">{t(`m.integrations.cats.${cat.id}.desc`)}</p>
                    </div>
                  </div>
                </Reveal>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                  className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
                >
                  {cat.integrations.map((it) => (
                    <motion.div
                      key={it.name}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                      transition={{ duration: 0.45, ease: EASE }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl border border-brand-surface-border bg-brand-surface-light px-3 py-5 text-center transition-all hover:border-brand-primary/30 hover:bg-white hover:shadow-md"
                    >
                      <p className="text-[13px] font-black tracking-tight text-brand-ink">{it.name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-brand-ink-hint">{t(`m.integrations.tag.${it.tagKey}`)}</p>
                      <span className="pointer-events-none absolute inset-x-3 -bottom-px h-[2px] w-0 bg-brand-primary transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-brand-surface-border">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <Reveal
            variant="scale"
            className="flex flex-col items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)] px-8 py-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] sm:flex-row sm:text-left"
          >
            <div>
              <h3 className="text-lg font-black text-white">{t('m.integrations.cta.title')}</h3>
              <p className="mt-1 text-sm font-medium text-brand-ink-hint">
                {t('m.integrations.cta.sub')}
              </p>
            </div>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink shadow-sm transition hover:bg-brand-primary-tint"
            >
              {t('m.integrations.cta.button')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
