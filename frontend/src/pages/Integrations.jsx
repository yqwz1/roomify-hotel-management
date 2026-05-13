import { Link } from 'react-router-dom';
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

/* Each "logo" is a wordmark tile — no external image dependencies */

const CATEGORIES = [
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payments',
    desc: 'Local and international gateways with PCI-DSS-grade tokenisation.',
    integrations: [
      { name: 'Mada', tag: 'Local SA' },
      { name: 'STC Pay', tag: 'Wallet' },
      { name: 'HyperPay', tag: 'Gateway' },
      { name: 'PayTabs', tag: 'Gateway' },
      { name: 'Stripe', tag: 'International' },
      { name: 'Apple Pay', tag: 'Wallet' },
    ],
  },
  {
    id: 'ota',
    icon: Globe2,
    title: 'Channel managers & OTAs',
    desc: 'Two-way sync for inventory, rates, and reservations.',
    integrations: [
      { name: 'Booking.com', tag: 'OTA' },
      { name: 'Expedia', tag: 'OTA' },
      { name: 'Airbnb', tag: 'OTA' },
      { name: 'Almosafer', tag: 'Local OTA' },
      { name: 'Agoda', tag: 'OTA' },
      { name: 'SiteMinder', tag: 'Channel mgr' },
    ],
  },
  {
    id: 'finance',
    icon: Receipt,
    title: 'Accounting & tax',
    desc: 'GL exports, VAT filing, and ZATCA clearance — out of the box.',
    integrations: [
      { name: 'ZATCA Fatoora', tag: 'e-Invoicing' },
      { name: 'QuickBooks', tag: 'Accounting' },
      { name: 'Zoho Books', tag: 'Accounting' },
      { name: 'Xero', tag: 'Accounting' },
      { name: 'SAP Business One', tag: 'ERP' },
    ],
  },
  {
    id: 'comms',
    icon: MessageCircle,
    title: 'Guest communication',
    desc: 'Pre-arrival, in-stay, and post-checkout messaging in Arabic & English.',
    integrations: [
      { name: 'WhatsApp Business', tag: 'Messaging' },
      { name: 'Unifonic', tag: 'SMS' },
      { name: 'Twilio', tag: 'SMS · Voice' },
      { name: 'SendGrid', tag: 'Email' },
    ],
  },
];

const STORY = [
  {
    icon: Plug,
    title: 'Plug-and-play',
    desc: 'Add an integration from the admin console — no engineering ticket.',
  },
  {
    icon: Workflow,
    title: 'Two-way sync',
    desc: 'Inventory, rates, and reservations stay in lockstep across every channel.',
  },
  {
    icon: Shield,
    title: 'Token-only',
    desc: 'Credentials are encrypted at rest. Each integration runs in its own sandbox.',
  },
];

export default function Integrations() {
  return (
    <div className="min-h-full bg-[#f7f3ed]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-zinc-200/40 to-transparent blur-3xl"
          animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 shadow-sm"
          >
            <Plug className="h-3 w-3" />
            Integrations
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl text-[2rem] font-black leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.4rem]"
          >
            Connects with everything your hotel already uses
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-2xl text-[0.95rem] font-medium leading-relaxed text-zinc-500"
          >
            Payment gateways, OTAs, accounting systems, and guest messaging — wired in from day one. Local-first, with international providers when you need them.
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner
              title="Integrations shown reflect our planned ecosystem, not live partnerships."
              note="Roomify is a student-built PMS. The providers listed below illustrate the direction the platform is heading — they aren't commercial commitments. Talk to us about what you actually run, and we'll be transparent about what's wired up today vs. on the roadmap."
              inline
            />
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
            {STORY.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.55, ease: EASE }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <p className="mt-3 text-sm font-black text-zinc-950">{title}</p>
                <p className="mt-1 text-[12px] font-medium leading-snug text-zinc-500">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16 space-y-14">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id}>
                <Reveal>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-zinc-950">{cat.title}</h2>
                      <p className="text-[13px] font-medium text-zinc-500">{cat.desc}</p>
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
                      className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-[#fafafa] px-3 py-5 text-center transition-all hover:border-zinc-300 hover:bg-white hover:shadow-md"
                    >
                      <p className="text-[13px] font-black tracking-tight text-zinc-950">{it.name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{it.tag}</p>
                      <span className="pointer-events-none absolute inset-x-3 -bottom-px h-[2px] w-0 bg-zinc-950 transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <Reveal
            variant="scale"
            className="flex flex-col items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)] px-8 py-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] sm:flex-row sm:text-left"
          >
            <div>
              <h3 className="text-lg font-black text-white">Missing something?</h3>
              <p className="mt-1 text-sm font-medium text-zinc-400">
                Tell us what you run. We&apos;ll build the integration with you.
              </p>
            </div>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-sm transition hover:bg-zinc-100"
            >
              Request an integration
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
