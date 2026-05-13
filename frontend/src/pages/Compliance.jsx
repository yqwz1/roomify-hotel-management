import { Link } from 'react-router-dom';
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
  {
    icon: ShieldCheck,
    title: 'ZATCA Phase 2 — Integrated e-invoicing',
    desc: 'Every invoice is generated with cryptographic stamp, embedded QR code, and Fatoora portal-ready XML payload. Auto-clearance against ZATCA before being shared with the guest.',
    bullets: ['XML invoice signing', 'QR on every receipt', 'Fatoora API integration', 'Audit-grade event log'],
    accent: 'border-emerald-200 bg-emerald-50',
    iconBg: 'bg-emerald-600',
  },
  {
    icon: FileCheck2,
    title: 'Saudi VAT 15% — by default',
    desc: 'Tax automatically calculated and itemised on every folio line — room rate, F&B, services, late checkout. B2B invoices include guest TRN, B2C receipts include the simplified format.',
    bullets: ['Itemised VAT breakdown', 'B2B vs B2C invoice templates', 'Reverse-charge handling', 'Tax period reporting'],
    accent: 'border-amber-200 bg-amber-50',
    iconBg: 'bg-amber-600',
  },
  {
    icon: Lock,
    title: 'Payment security',
    desc: 'Card data never touches our servers. Tokenised through PCI-DSS Level 1 providers (Mada, Stripe, HyperPay). 3-D Secure mandatory on every transaction over SAR 1,000.',
    bullets: ['PCI DSS L1 providers', 'Card data tokenisation', '3-D Secure enforcement', 'Refund audit trail'],
    accent: 'border-zinc-200 bg-zinc-50',
    iconBg: 'bg-zinc-900',
  },
  {
    icon: KeyRound,
    title: 'Role-based access control',
    desc: 'Four roles — Admin, Manager, Staff, Guest — with route-level enforcement on both client and server. Every privileged action is logged with actor, target, IP, and timestamp.',
    bullets: ['Server-enforced permissions', 'Granular role policies', 'Immutable audit log', 'Session revocation'],
    accent: 'border-zinc-200 bg-zinc-50',
    iconBg: 'bg-zinc-900',
  },
];

const STANDARDS = [
  { label: 'ZATCA Phase 2', sub: 'e-invoicing' },
  { label: 'VAT 15%', sub: 'Saudi tax' },
  { label: 'PCI DSS L1', sub: 'via providers' },
  { label: 'GDPR-ready', sub: 'data handling' },
  { label: 'ISO 27001 path', sub: '2026' },
  { label: 'Data residency', sub: 'Riyadh region' },
];

export default function Compliance() {
  return (
    <div className="min-h-full bg-[#f7f3ed]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-200/30 to-transparent blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, 12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800 shadow-sm"
          >
            <ShieldCheck className="h-3 w-3" />
            Saudi-first compliance
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl text-[2rem] font-black leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.4rem]"
          >
            Built for the Kingdom — ZATCA, VAT, and beyond
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="mt-3 max-w-2xl text-[0.95rem] font-medium leading-relaxed text-zinc-500"
          >
            Roomify isn't an international PMS with an SA bolt-on. Tax compliance, e-invoicing, and Saudi-specific guest data handling are first-class — not an integration you wire yourself.
          </motion.p>

          <div className="mt-6">
            <RoadmapBanner
              title="Compliance claims here describe what Roomify is being built to handle, not certified status."
              note="ZATCA Phase 2 clearance, PCI-DSS attestation, and ISO 27001 are real targets on our roadmap — but Roomify is a student project, not a certified production system yet. Treat the details below as the design we're working toward."
              inline
            />
          </div>

          {/* Sample invoice card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
            className="mt-10 grid gap-5 sm:grid-cols-[1.3fr_1fr]"
          >
            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Tax invoice</p>
                  <p className="mt-1 text-sm font-black text-zinc-950">Roomify Hotel — Riyadh</p>
                  <p className="text-[11px] font-medium text-zinc-500">TRN: 300123456789003</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-2.5">
                  <QrCode className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="mt-5 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-zinc-600"><span>Room 204 · 3 nights</span><span className="font-mono">1,200.00</span></div>
                <div className="flex justify-between text-zinc-600"><span>F&B charges</span><span className="font-mono">185.00</span></div>
                <div className="flex justify-between text-zinc-400 text-xs"><span>Subtotal</span><span className="font-mono">1,385.00</span></div>
                <div className="flex justify-between text-zinc-400 text-xs"><span>VAT 15%</span><span className="font-mono">207.75</span></div>
                <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 text-sm font-black text-zinc-950">
                  <span>Total (SAR)</span><span className="font-mono">1,592.75</span>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-medium text-zinc-400">Signed XML submitted to Fatoora · UUID: 4f8b…c20e</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <Reveal className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-sm font-black text-emerald-950">Cleared by ZATCA</p>
                <p className="mt-1 text-[12px] font-medium text-emerald-800">Before the guest sees it</p>
              </Reveal>
              <Reveal delay={0.1} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <FileCheck2 className="h-5 w-5 text-amber-700" />
                <p className="mt-3 text-sm font-black text-amber-950">VAT 15% itemised</p>
                <p className="mt-1 text-[12px] font-medium text-amber-800">Auto, per line</p>
              </Reveal>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
          <Reveal as="p" className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Compliance pillars</Reveal>
          <Reveal as="h2" delay={0.08} className="mt-1.5 max-w-xl text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            Four pillars, fully owned by the platform
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
                  key={p.title}
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
                  <h3 className="mt-4 text-base font-black tracking-tight text-zinc-950">{p.title}</h3>
                  <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-zinc-600">{p.desc}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-1.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-[12px] font-semibold text-zinc-700">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                        {b}
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
      <section className="border-t border-zinc-200 bg-[#f7f3ed]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <Reveal as="p" className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Standards we follow</Reveal>
          <Reveal as="h2" delay={0.08} className="mt-1.5 text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            What we attest to
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
            {STANDARDS.map((s) => (
              <motion.div
                key={s.label}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: EASE }}
                whileHover={{ y: -3 }}
                className="flex flex-col items-start gap-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <ScrollText className="h-4 w-4 text-zinc-400" />
                <p className="text-sm font-black text-zinc-950">{s.label}</p>
                <p className="text-[10px] font-medium text-zinc-500">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DATA RESIDENCY */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Data residency</p>
              <h2 className="mt-1.5 max-w-md text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
                Guest data stays in the Kingdom
              </h2>
              <p className="mt-3 max-w-md text-[14px] font-medium leading-relaxed text-zinc-500">
                Production databases and backups run on infrastructure hosted in Riyadh. Cross-border data transfer is opt-in, logged, and disabled by default to align with the Saudi Personal Data Protection Law (PDPL).
              </p>
              <Link
                to="/demo"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Talk to compliance
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Reveal>
            <Reveal delay={0.1} variant="scale">
              <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-950">Primary region</p>
                    <p className="text-[12px] font-medium text-zinc-500">Riyadh, Saudi Arabia</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-[13px] text-zinc-700">
                  {[
                    'Encryption at rest (AES-256)',
                    'Encryption in transit (TLS 1.3)',
                    'Daily encrypted backups · 30-day retention',
                    'Quarterly disaster recovery drills',
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>{line}</span>
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
