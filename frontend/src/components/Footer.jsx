import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck2,
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatLocalizedDateTime } from '../utils/localization';
import { EASE } from './motion/Reveal';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function FooterColumn({ title, children }) {
  return (
    <motion.div variants={fadeUp} transition={{ duration: 0.65, ease: EASE }}>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
        {title}
      </p>
      <div className="mt-4 space-y-2.5 text-sm font-medium text-zinc-300">
        {children}
      </div>
    </motion.div>
  );
}

function FooterLink({ to, href, children, external = false }) {
  const className =
    'group inline-flex items-center gap-1 transition-colors hover:text-white';
  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:translate-x-0 group-hover:opacity-60 rtl:rotate-[270deg]" />
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
}

export default function Footer({
  connectionState = 'disconnected',
  timestamp = null,
  loading = false,
}) {
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');

  const statusKey = loading
    ? 'footer.connectionChecking'
    : connectionState === 'connected'
      ? 'footer.connectionConnected'
      : 'footer.connectionDisconnected';

  const statusDot = loading
    ? 'bg-zinc-400'
    : connectionState === 'connected'
      ? 'bg-emerald-400'
      : 'bg-rose-400';

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_45%),linear-gradient(180deg,#0a0a0a_0%,#000_100%)] text-white">
      {/* Decorative accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
      />

      {/* ── Top: brand + columns ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16"
      >
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2.4fr] lg:gap-16">

          {/* Brand block */}
          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: EASE }}>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sm font-black text-zinc-950 shadow-sm">
                R
              </span>
              <span className="font-heading text-3xl font-black tracking-tighter text-white">
                {brandName}
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-zinc-400">
              {t('footer.tagline')}
            </p>

            {/* Compliance badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300"
                title={t('footer.zatcaTooltip', {
                  defaultValue: 'ZATCA Phase 2 (e-invoicing) compliant',
                })}
              >
                <ShieldCheck className="h-3 w-3" />
                {t('footer.zatcaBadge', { defaultValue: 'ZATCA Compliant' })}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300"
                title={t('footer.vatTooltip', {
                  defaultValue: 'Saudi VAT (15%) invoicing supported',
                })}
              >
                <FileCheck2 className="h-3 w-3" />
                {t('footer.vatBadge', { defaultValue: 'Saudi VAT 15%' })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-3 w-3" />
                {t('footer.aiBadge', { defaultValue: 'AI-Powered' })}
              </span>
            </div>

          </motion.div>

          {/* Columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            <FooterColumn title={t('footer.product', { defaultValue: 'Product' })}>
              <FooterLink to="/pricing">{t('navPricing', { defaultValue: 'Pricing' })}</FooterLink>
              <FooterLink to="/integrations">{t('navIntegrations', { defaultValue: 'Integrations' })}</FooterLink>
              <FooterLink to="/compliance">{t('navCompliance', { defaultValue: 'Compliance' })}</FooterLink>
              <FooterLink to="/demo">{t('navDemo', { defaultValue: 'Request a demo' })}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t('footer.forTeams', { defaultValue: 'For Hotel Teams' })}>
              <FooterLink to="/login">{t('footer.staffAccess', { defaultValue: 'Staff Access' })}</FooterLink>
              <FooterLink to="/login">{t('dashboard')}</FooterLink>
              <FooterLink to="/bookings">{t('footer.bookingSupport')}</FooterLink>
              <FooterLink to="/login">{t('signIn')}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t('footer.platform')}>
              <p className="text-zinc-400">{t('home.features.reservationsTitle')}</p>
              <p className="text-zinc-400">{t('home.features.roomOpsTitle')}</p>
              <p className="text-zinc-400">{t('home.features.billingTitle')}</p>
              <p className="text-zinc-400">{t('footer.aiInsights', { defaultValue: 'AI Insights' })}</p>
            </FooterColumn>

            <FooterColumn title={t('footer.contact')}>
              <a
                href="mailto:info@roomify.com"
                className="group flex items-start gap-2 text-zinc-300 transition-colors hover:text-white"
                dir="ltr"
              >
                <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
                <span>info@roomify.com</span>
              </a>
              <a
                href="tel:+15551234567"
                className="group flex items-start gap-2 text-zinc-300 transition-colors hover:text-white"
                dir="ltr"
              >
                <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
                <span>+1 (555) 123-4567</span>
              </a>
              <div className="flex items-start gap-2 text-zinc-400">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                <span>{t('footer.contactAddressValue')}</span>
              </div>
            </FooterColumn>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom bar: copyright + status ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-zinc-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="text-xs font-medium text-zinc-500">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${statusDot} ${
                    connectionState === 'connected' ? 'animate-ping' : ''
                  }`}
                />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${statusDot}`} />
              </span>
              <span className="text-xs font-bold text-zinc-300">{t(statusKey)}</span>
              <span className="text-xs font-medium text-zinc-500">
                · {t('footer.connectionLabel')}
              </span>
            </div>

            <p className="text-xs text-zinc-500">
              {timestamp
                ? t('footer.connectionVerifiedAt', {
                    time: formatLocalizedDateTime(timestamp, i18n.language),
                  })
                : t('footer.connectionTemporary')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
