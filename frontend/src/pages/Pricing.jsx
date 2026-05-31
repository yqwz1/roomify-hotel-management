import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Check,
  ArrowRight,
  Building2,
  Hotel,
  Crown,
  Sparkles,
} from 'lucide-react';
import Footer from '../components/Footer';
import Reveal, { EASE } from '../components/motion/Reveal';
import RoadmapBanner from '../components/marketing/RoadmapBanner';

const PLANS = [
  {
    id: 'starter',
    icon: Building2,
    price: '499',
    accent: 'border-brand-surface-border bg-white',
    ctaClass: 'bg-brand-primary text-white hover:bg-brand-primary-deep',
    featured: false,
    featureCount: 6,
  },
  {
    id: 'pro',
    icon: Hotel,
    price: '1,299',
    accent: 'roomify-luxe-gradient border-white/10 text-white shadow-2xl shadow-brand-primary/30',
    ctaClass: 'bg-white text-brand-ink hover:bg-brand-primary-tint',
    featured: true,
    featureCount: 7,
  },
  {
    id: 'enterprise',
    icon: Crown,
    price: 'Custom',
    accent: 'border-brand-surface-border bg-white',
    ctaClass: 'bg-brand-primary text-white hover:bg-brand-primary-deep',
    featured: false,
    featureCount: 7,
  },
];

const FAQ_IDS = ['trial', 'zatca', 'switch', 'vat'];

export default function Pricing() {
  const { t } = useTranslation();
  return (
    <div className="roomify-page-enter min-h-full bg-brand-surface">
      {/* HERO */}
      <section className="roomify-aurora relative overflow-hidden text-white">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-accent-gold/20 to-transparent blur-3xl"
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-surface to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-champagne shadow-sm backdrop-blur"
          >
            {t('m.pricing.eyebrow')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl font-serif text-[2.4rem] font-black leading-[1.02] tracking-tight text-white sm:text-[4.2rem]"
          >
            {t('m.pricing.headline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-4 max-w-xl text-base font-medium leading-7 text-white/78"
          >
            {t('m.pricing.subhead')}
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner tone="pricing" inline />
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
            className="grid min-w-0 gap-5 lg:grid-cols-3"
          >
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCustom = plan.price === 'Custom';
              return (
                <motion.article
                  key={plan.id}
                  variants={{
                    hidden: { opacity: 0, y: 28 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.65, ease: EASE }}
                  whileHover={{ y: -6 }}
                  className={`relative flex min-w-0 flex-col rounded-[2rem] border p-7 transition-shadow ${plan.accent} ${plan.featured ? 'pt-9' : 'hover:shadow-lg hover:shadow-brand-primary-deep/10'}`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 inline-flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 truncate whitespace-nowrap rounded-full bg-brand-accent-gold px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-ink shadow-md">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      {t('m.pricing.popular')}
                    </span>
                  )}
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${plan.featured ? 'bg-white/10' : 'bg-brand-primary-tint'}`}>
                    <Icon className={`h-5 w-5 shrink-0 ${plan.featured ? 'text-brand-accent-gold' : 'text-brand-ink'}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight break-words">{t(`m.pricing.${plan.id}.name`)}</h3>
                  <p className={`text-sm font-medium ${plan.featured ? 'text-brand-ink-hint' : 'text-brand-ink-muted'}`}>
                    {t(`m.pricing.${plan.id}.tagline`)}
                  </p>
                  <div className="mt-5 flex min-w-0 items-baseline gap-1">
                    {isCustom ? (
                      <span className="text-3xl font-black tracking-tight break-words">{t('m.pricing.custom')}</span>
                    ) : (
                      <>
                        <span className={`text-xs font-bold ${plan.featured ? 'text-brand-ink-hint' : 'text-brand-ink-muted'}`}>{t('m.pricing.sar')}</span>
                        <span className="text-4xl font-black tracking-tight break-words">{plan.price}</span>
                        <span className={`text-sm font-medium ${plan.featured ? 'text-brand-ink-hint' : 'text-brand-ink-muted'}`}>
                          {t('m.pricing.perMonth')}
                        </span>
                      </>
                    )}
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-sm ${plan.featured ? 'text-white/85' : 'text-brand-ink'}`}>
                    {Array.from({ length: plan.featureCount }, (_, i) => (
                      <li key={i} className="flex min-w-0 items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.featured ? 'text-brand-accent-gold' : 'text-brand-success'}`} />
                        <span className="min-w-0 break-words">{t(`m.pricing.${plan.id}.f${i + 1}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.id === 'enterprise' ? '/demo' : '/login'}
                    className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all ${plan.ctaClass}`}
                  >
                    {t(`m.pricing.${plan.id}.cta`)}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 shrink-0" />
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>

          <Reveal className="mt-8 rounded-2xl border border-brand-surface-border bg-white px-5 py-4 text-center text-[13px] font-medium text-brand-ink-muted">
            {t('m.pricing.allInclude')}
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:px-10">
          <Reveal as="p" className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {t('m.pricing.faqEyebrow')}
          </Reveal>
          <Reveal as="h2" delay={0.08} className="mx-auto mt-1.5 text-center text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
            {t('m.pricing.faqTitle')}
          </Reveal>
          <div className="mt-8 space-y-3">
            {FAQ_IDS.map((id, i) => (
              <Reveal
                key={id}
                delay={0.05 * i}
                className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-5"
              >
                <p className="text-sm font-black text-brand-ink break-words">{t(`m.pricing.faq.${id}.q`)}</p>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-brand-ink-muted break-words">{t(`m.pricing.faq.${id}.a`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
