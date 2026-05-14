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
    accent: 'border-zinc-200 bg-white',
    ctaClass: 'bg-zinc-950 text-white hover:bg-zinc-800',
    featured: false,
    featureCount: 6,
  },
  {
    id: 'pro',
    icon: Hotel,
    price: '1,299',
    accent: 'border-zinc-950 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/30',
    ctaClass: 'bg-white text-zinc-950 hover:bg-zinc-100',
    featured: true,
    featureCount: 7,
  },
  {
    id: 'enterprise',
    icon: Crown,
    price: 'Custom',
    accent: 'border-zinc-200 bg-white',
    ctaClass: 'bg-zinc-950 text-white hover:bg-zinc-800',
    featured: false,
    featureCount: 7,
  },
];

const FAQ_IDS = ['trial', 'zatca', 'switch', 'vat'];

export default function Pricing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-full bg-[#f7f3ed]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-200/30 to-transparent blur-3xl"
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 shadow-sm"
          >
            {t('m.pricing.eyebrow')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-zinc-950 sm:text-[2.6rem]"
          >
            {t('m.pricing.headline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-xl text-[0.95rem] font-medium leading-relaxed text-zinc-500"
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
            className="grid gap-5 lg:grid-cols-3"
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
                  className={`relative flex flex-col rounded-[2rem] border p-7 transition-shadow ${plan.accent} ${plan.featured ? '' : 'hover:shadow-lg hover:shadow-zinc-200/60'}`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 shadow-md">
                      <Sparkles className="h-3 w-3" />
                      {t('m.pricing.popular')}
                    </span>
                  )}
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${plan.featured ? 'bg-white/10' : 'bg-zinc-100'}`}>
                    <Icon className={`h-5 w-5 ${plan.featured ? 'text-amber-300' : 'text-zinc-700'}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight">{t(`m.pricing.${plan.id}.name`)}</h3>
                  <p className={`text-sm font-medium ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {t(`m.pricing.${plan.id}.tagline`)}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    {isCustom ? (
                      <span className="text-3xl font-black tracking-tight">{t('m.pricing.custom')}</span>
                    ) : (
                      <>
                        <span className={`text-xs font-bold ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('m.pricing.sar')}</span>
                        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                        <span className={`text-sm font-medium ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {t('m.pricing.perMonth')}
                        </span>
                      </>
                    )}
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-sm ${plan.featured ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {Array.from({ length: plan.featureCount }, (_, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.featured ? 'text-amber-300' : 'text-emerald-600'}`} />
                        <span>{t(`m.pricing.${plan.id}.f${i + 1}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.id === 'enterprise' ? '/demo' : '/login'}
                    className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all ${plan.ctaClass}`}
                  >
                    {t(`m.pricing.${plan.id}.cta`)}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>

          <Reveal className="mt-8 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center text-[13px] font-medium text-zinc-500">
            {t('m.pricing.allInclude')}
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:px-10">
          <Reveal as="p" className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">
            {t('m.pricing.faqEyebrow')}
          </Reveal>
          <Reveal as="h2" delay={0.08} className="mx-auto mt-1.5 text-center text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            {t('m.pricing.faqTitle')}
          </Reveal>
          <div className="mt-8 space-y-3">
            {FAQ_IDS.map((id, i) => (
              <Reveal
                key={id}
                delay={0.05 * i}
                className="rounded-2xl border border-zinc-200 bg-[#fafafa] p-5"
              >
                <p className="text-sm font-black text-zinc-950">{t(`m.pricing.faq.${id}.q`)}</p>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-zinc-600">{t(`m.pricing.faq.${id}.a`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
