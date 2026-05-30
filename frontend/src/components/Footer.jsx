import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck2,
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
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55 break-words">
        {title}
      </p>
      <div className="mt-4 space-y-2.5 text-sm font-medium text-white/75">
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
      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:translate-x-0 group-hover:opacity-60 rtl:rotate-[270deg] shrink-0" />
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
    ? 'bg-white/45'
    : connectionState === 'connected'
      ? 'bg-brand-success'
      : 'bg-brand-danger';

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(220,231,238,0.08),transparent_45%),linear-gradient(180deg,#264B6B_0%,#1A2B3A_100%)] text-white">
      {/* Decorative accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
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
        <div className="grid min-w-0 gap-12 lg:grid-cols-[1.3fr_2.4fr] lg:gap-16">

          {/* Brand block */}
          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: EASE }}>
            <Link to="/" className="inline-flex min-w-0 items-center" aria-label={brandName}>
              <img
                src="/roomify-mark-light.png"
                alt={brandName}
                className="h-14 w-auto select-none"
                draggable={false}
              />
            </Link>

            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/65 break-words">
              {t('footer.tagline')}
            </p>

            {/* Compliance badges */}
            <div className="mt-6 flex min-w-0 flex-wrap gap-2">
              <span
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-brand-success/30 bg-brand-success/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-success break-words"
                title={t('footer.zatcaTooltip', {
                  defaultValue: 'ZATCA Phase 2 (e-invoicing) compliant',
                })}
              >
                <ShieldCheck className="h-3 w-3 shrink-0" />
                {t('footer.zatcaBadge', { defaultValue: 'ZATCA Compliant' })}
              </span>
              <span
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/80 break-words"
                title={t('footer.vatTooltip', {
                  defaultValue: 'Saudi VAT (15%) invoicing supported',
                })}
              >
                <FileCheck2 className="h-3 w-3 shrink-0" />
                {t('footer.vatBadge', { defaultValue: 'Saudi VAT 15%' })}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-brand-accent-gold/30 bg-brand-accent-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-accent-gold break-words">
                <Sparkles className="h-3 w-3 shrink-0" />
                {t('footer.aiBadge', { defaultValue: 'AI-Powered' })}
              </span>
            </div>

          </motion.div>

          {/* Columns */}
          <div className="grid min-w-0 gap-10 sm:grid-cols-2 lg:grid-cols-4">

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
              <p className="text-white/65 break-words">{t('home.features.reservationsTitle')}</p>
              <p className="text-white/65 break-words">{t('home.features.roomOpsTitle')}</p>
              <p className="text-white/65 break-words">{t('home.features.billingTitle')}</p>
              <p className="text-white/65 break-words">{t('footer.aiInsights', { defaultValue: 'AI Insights' })}</p>
            </FooterColumn>

          </div>
        </div>
      </motion.div>

      {/* ── Bottom bar: copyright + status ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-white/65 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="text-xs font-medium text-white/55 break-words">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </p>

          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex min-w-0 h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${statusDot} ${
                    connectionState === 'connected' ? 'animate-ping' : ''
                  }`}
                />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${statusDot}`} />
              </span>
              <span className="text-xs font-bold text-white/85 break-words">{t(statusKey)}</span>
              <span className="text-xs font-medium text-white/55 break-words">
                · {t('footer.connectionLabel')}
              </span>
            </div>

            <p className="text-xs text-white/55 break-words">
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
