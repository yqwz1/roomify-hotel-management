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
    name: 'Starter',
    tagline: 'Up to 30 rooms',
    price: '499',
    cadence: '/ month',
    accent: 'border-zinc-200 bg-white',
    cta: 'Start free trial',
    ctaClass: 'bg-zinc-950 text-white hover:bg-zinc-800',
    featured: false,
    features: [
      'Up to 30 rooms',
      'Reservation management',
      'Guest folios & checkout',
      'ZATCA-compliant invoices',
      'Single property',
      'Email support',
    ],
  },
  {
    id: 'pro',
    icon: Hotel,
    name: 'Pro',
    tagline: '30 – 150 rooms',
    price: '1,299',
    cadence: '/ month',
    accent: 'border-zinc-950 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/30',
    cta: 'Start with Pro',
    ctaClass: 'bg-white text-zinc-950 hover:bg-zinc-100',
    featured: true,
    features: [
      'Everything in Starter',
      'Up to 150 rooms',
      'Multi-staff workflows',
      'AI revenue forecasting',
      'Expense tracking',
      'Live room board',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    icon: Crown,
    name: 'Enterprise',
    tagline: '150+ rooms · multi-property',
    price: 'Custom',
    cadence: '',
    accent: 'border-zinc-200 bg-white',
    cta: 'Contact sales',
    ctaClass: 'bg-zinc-950 text-white hover:bg-zinc-800',
    featured: false,
    features: [
      'Everything in Pro',
      'Unlimited rooms',
      'Multi-property management',
      'Dedicated success manager',
      'SLA-backed uptime',
      'Custom integrations',
      'On-premise option',
    ],
  },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every plan includes a 14-day free trial with full access. No credit card required to start.',
  },
  {
    q: 'Are invoices ZATCA Phase 2 compliant?',
    a: 'Every invoice generated includes the required QR code, VAT breakdown, and is signed for Fatoora portal submission.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Plans are flexible — upgrade or downgrade at any time, prorated to your billing cycle.',
  },
  {
    q: 'Do you support Saudi VAT?',
    a: 'VAT 15% is auto-calculated on every billable item, with itemised tax breakdowns on guest folios.',
  },
];

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
            {t('pricing.eyebrow', { defaultValue: 'Pricing' })}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl text-[2rem] font-black leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.4rem]"
          >
            {t('pricing.headline', {
              defaultValue: 'Simple, transparent pricing for every property',
            })}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-xl text-[0.95rem] font-medium leading-relaxed text-zinc-500"
          >
            {t('pricing.subhead', {
              defaultValue:
                'Pick the plan that fits your property size. Upgrade any time. All prices in SAR, exclusive of VAT.',
            })}
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner
              title="Prices shown are illustrative — Roomify is not currently billing customers."
              note="These plans represent how Roomify will be priced when it ships. As a student-built PMS, we don't take payment yet."
              inline
            />
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
                      Most popular
                    </span>
                  )}
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${plan.featured ? 'bg-white/10' : 'bg-zinc-100'}`}>
                    <Icon className={`h-5 w-5 ${plan.featured ? 'text-amber-300' : 'text-zinc-700'}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight">{plan.name}</h3>
                  <p className={`text-sm font-medium ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {plan.tagline}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    {plan.price === 'Custom' ? (
                      <span className="text-3xl font-black tracking-tight">Custom</span>
                    ) : (
                      <>
                        <span className={`text-xs font-bold ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>SAR</span>
                        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                        <span className={`text-sm font-medium ${plan.featured ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {plan.cadence}
                        </span>
                      </>
                    )}
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-sm ${plan.featured ? 'text-zinc-200' : 'text-zinc-700'}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.featured ? 'text-amber-300' : 'text-emerald-600'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.id === 'enterprise' ? '/demo' : '/login'}
                    className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all ${plan.ctaClass}`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>

          <Reveal className="mt-8 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center text-[13px] font-medium text-zinc-500">
            All plans include ZATCA Phase 2 compliance, role-based access, and 99.9% uptime SLA.
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:px-10">
          <Reveal as="p" className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">
            FAQ
          </Reveal>
          <Reveal as="h2" delay={0.08} className="mx-auto mt-1.5 text-center text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            Common questions
          </Reveal>
          <div className="mt-8 space-y-3">
            {FAQS.map((item, i) => (
              <Reveal
                key={item.q}
                delay={0.05 * i}
                className="rounded-2xl border border-zinc-200 bg-[#fafafa] p-5"
              >
                <p className="text-sm font-black text-zinc-950">{item.q}</p>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-zinc-600">{item.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
