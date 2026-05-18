import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  Receipt,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Sparkles,
  LogIn,
  Search,
  CreditCard,
  ClipboardCheck,
  FileText,
  DoorOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import Reveal, { EASE } from '../components/motion/Reveal';
import { checkHealth } from '../services/healthService';
import { useAuth } from '../context/AuthProvider';
import { getDefaultRouteForRoles } from '../components/navigation/navConfig';

/* ════════════════════════════════════════════════════════════
   MOCK DATA — visual only, no API calls
   ════════════════════════════════════════════════════════════ */

const LIVE_STATS = [
  { id: 'totalRooms', value: '120', icon: BedDouble, color: 'text-brand-ink' },
  { id: 'occupied', value: '87', icon: CheckCircle2, color: 'text-brand-ink' },
  { id: 'available', value: '24', icon: Clock, color: 'text-brand-success' },
  { id: 'maintenance', value: '9', icon: Clock, color: 'text-brand-warning' },
];

const ROOM_GRID = [
  { num: '101', status: 'occupied' }, { num: '102', status: 'available' },
  { num: '103', status: 'occupied' }, { num: '104', status: 'checkout' },
  { num: '105', status: 'available' }, { num: '106', status: 'occupied' },
  { num: '107', status: 'maintenance' }, { num: '108', status: 'occupied' },
  { num: '201', status: 'available' }, { num: '202', status: 'occupied' },
  { num: '203', status: 'occupied' }, { num: '204', status: 'available' },
  { num: '205', status: 'checkout' }, { num: '206', status: 'occupied' },
  { num: '207', status: 'available' }, { num: '208', status: 'occupied' },
];

const ROOM_STATUS_MAP = {
  occupied: { bg: 'bg-brand-primary-deep', label: 'Occupied' },
  available: { bg: 'bg-brand-success', label: 'Available' },
  checkout: { bg: 'bg-brand-warning', label: 'Due Out' },
  maintenance: { bg: 'bg-brand-ink-hint', label: 'Maint.' },
};

const TODAY_ACTIVITY = [
  { time: '07:15', event: 'Room 302 — Checkout completed', type: 'checkout' },
  { time: '08:30', event: 'Room 110 — Sara Noor checked in', type: 'checkin' },
  { time: '09:00', event: 'Room 204 — Reservation confirmed', type: 'reservation' },
  { time: '09:45', event: 'Room 107 — Maintenance requested', type: 'maintenance' },
  { time: '10:20', event: 'Invoice #1047 — Generated for Room 302', type: 'invoice' },
];

const ACTIVITY_COLORS = {
  checkout: 'bg-brand-warning',
  checkin: 'bg-brand-success',
  reservation: 'bg-brand-ink-muted',
  maintenance: 'bg-brand-ink-hint',
  invoice: 'bg-brand-primary-deep',
};

const MODULES = [
  { id: 'reservations', icon: CalendarClock, color: 'bg-brand-primary' },
  { id: 'rooms', icon: BedDouble, color: 'bg-brand-success' },
  { id: 'billing', icon: Receipt, color: 'bg-brand-warning' },
  { id: 'insights', icon: BarChart3, color: 'bg-brand-primary' },
];

const WORKFLOW = [
  { id: 'search', icon: Search },
  { id: 'reserve', icon: CalendarClock },
  { id: 'checkin', icon: ClipboardCheck },
  { id: 'charges', icon: CreditCard },
  { id: 'invoice', icon: FileText },
  { id: 'checkout', icon: DoorOpen },
];

const CAPABILITIES = [
  { id: 'roles', icon: Shield },
  { id: 'multi', icon: Users },
  { id: 'realtime', icon: TrendingUp },
  { id: 'ai', icon: Sparkles },
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function Home() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const brandName = t('brandName');
  const dashboardPath = getDefaultRouteForRoles(user?.roles ?? []);
  const dashboardLabel = user?.roles?.includes('ROLE_GUEST') ? t('myDashboard') : t('dashboard');
  const [health, setHealth] = useState(null);
  const [statusFetchedAt, setStatusFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        if (!isMounted) return;
        setHealth(data);
        setStatusFetchedAt(data?.timestamp || Date.now());
      } catch {
        if (!isMounted) return;
        setHealth(null);
        setStatusFetchedAt(Date.now());
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHealth();
    return () => { isMounted = false; };
  }, []);

  /* ── Authenticated redirect (preserved) ── */
  if (!authLoading && isAuthenticated) {
    return <Navigate to={dashboardPath} replace />;
  }

  const hoverLift = reduceMotion ? {} : { y: -4 };

  return (
    <div className="min-h-full bg-brand-surface">

      {/* ──────────────────────────────────────────────
          HERO
         ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <motion.div
            className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-brand-primary-tint/50 to-transparent blur-3xl"
            animate={reduceMotion ? {} : { y: [0, 18, 0], x: [0, -12, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-brand-accent-gold/15 to-transparent blur-2xl"
            animate={reduceMotion ? {} : { y: [0, -14, 0], x: [0, 10, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-10 sm:px-8 lg:px-10 lg:pb-10 lg:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">

            {/* LEFT — Copy */}
            <div className="flex flex-col justify-center lg:pt-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-ink-muted shadow-sm"
              >
                {t('m.home.eyebrow')}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                className="mt-4 font-serif text-[1.85rem] font-medium leading-[1.1] tracking-[-0.015em] text-brand-ink sm:text-[2.4rem] lg:text-[2.8rem]"
              >
                {t('m.home.headline')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
                className="mt-3 max-w-md text-[0.9rem] font-medium leading-relaxed text-brand-ink-muted"
              >
                {t('m.home.bio')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: EASE }}
                className="mt-6 flex flex-wrap gap-2.5"
              >
                <motion.div whileHover={reduceMotion ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/login"
                    id="hero-login-cta"
                    className="group inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/30 transition-all hover:bg-brand-primary-deep hover:shadow-xl hover:shadow-brand-primary-deep/35"
                  >
                    <LogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    {t('m.home.ctaLogin')}
                  </Link>
                </motion.div>
                <motion.div whileHover={reduceMotion ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/bookings"
                    id="hero-booking-cta"
                    className="group inline-flex items-center gap-1.5 rounded-full border border-brand-surface-border bg-white px-5 py-2.5 text-sm font-bold text-brand-ink shadow-sm transition-all hover:border-brand-primary/30 hover:bg-brand-surface-light hover:text-brand-ink"
                  >
                    {t('m.home.ctaSupport')}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                  </Link>
                </motion.div>
              </motion.div>

              {/* Quick stat chips */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.85 } },
                }}
                className="mt-7 flex flex-wrap gap-4 border-t border-brand-surface-border pt-5"
              >
                {LIVE_STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.id}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="flex items-center gap-2"
                    >
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                        <span className="text-xs font-medium text-brand-ink-hint">{t(`m.home.stat.${s.id}`)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* RIGHT — App Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="relative"
            >
              <motion.div
                whileHover={reduceMotion ? {} : { y: -6 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="rounded-[1.75rem] border border-brand-surface-border bg-white shadow-xl shadow-brand-primary-deep/10 ring-1 ring-brand-ink/5"
              >
                {/* Window chrome */}
                <div className="flex items-center gap-2 rounded-t-[1.75rem] border-b border-brand-surface-border bg-brand-surface-light/70 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-danger/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-warning/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-success/80" />
                  </div>
                  <div className="ml-2 flex-1 rounded-full bg-white/80 border border-brand-surface-border/60 px-3 py-1 text-[10px] text-brand-ink-hint font-mono">
                    app.roomify.io/dashboard
                  </div>
                </div>

                {/* Mock app body */}
                <div className="flex min-h-[340px] sm:min-h-[380px]">
                  {/* Sidebar */}
                  <div className="hidden w-[140px] flex-shrink-0 border-r border-brand-surface-border bg-brand-primary-tint p-3 sm:block rounded-bl-[1.75rem]">
                    <div className="mb-4 flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-brand-ink">Roomify</span>
                    </div>
                    {['Dashboard', 'Reservations', 'Rooms', 'Guests', 'Billing', 'Reports'].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + i * 0.05, ease: EASE }}
                        className={`mb-0.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${
                          i === 0 ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-ink-muted hover:bg-white hover:text-brand-ink'
                        }`}
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>

                  {/* Main area */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Occupancy', val: '72%', sub: '+4% vs last week', accent: 'text-brand-ink' },
                        { label: 'Rev Today', val: 'SAR 4,280', sub: '18 transactions', accent: 'text-brand-success' },
                        { label: 'Arrivals', val: '8', sub: '3 pending', accent: 'text-brand-warning' },
                        { label: 'Departures', val: '5', sub: '2 late checkout', accent: 'text-brand-ink' },
                      ].map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: 0.8 + i * 0.07, ease: EASE }}
                          className="rounded-xl border border-brand-surface-border bg-brand-surface-light/50 px-2.5 py-2"
                        >
                          <p className="text-[9px] font-black uppercase tracking-wider text-brand-ink-hint">{s.label}</p>
                          <p className={`text-base font-black leading-tight ${s.accent}`}>{s.val}</p>
                          <p className="mt-0.5 text-[9px] text-brand-ink-hint hidden sm:block">{s.sub}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.85fr]">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-ink-muted">Room Board</span>
                          <div className="flex gap-2">
                            {Object.entries(ROOM_STATUS_MAP).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${val.bg}`} />
                                <span className="text-[8px] text-brand-ink-hint">{val.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.02, delayChildren: 1.0 } },
                          }}
                          className="grid grid-cols-8 gap-1"
                        >
                          {ROOM_GRID.map((r) => (
                            <motion.div
                              key={r.num}
                              variants={{
                                hidden: { opacity: 0, scale: 0.6 },
                                visible: { opacity: 1, scale: 1 },
                              }}
                              transition={{ duration: 0.35, ease: EASE }}
                              whileHover={reduceMotion ? {} : { scale: 1.15, y: -2 }}
                              className={`flex h-8 cursor-pointer items-center justify-center rounded-lg text-[9px] font-bold text-white ${ROOM_STATUS_MAP[r.status].bg}`}
                              title={`${r.num} — ${ROOM_STATUS_MAP[r.status].label}`}
                            >
                              {r.num}
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>

                      <div>
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-brand-ink-muted">Live Activity</span>
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1, delayChildren: 1.1 } },
                          }}
                          className="space-y-1"
                        >
                          {TODAY_ACTIVITY.map((a, i) => (
                            <motion.div
                              key={i}
                              variants={{
                                hidden: { opacity: 0, x: 12 },
                                visible: { opacity: 1, x: 0 },
                              }}
                              transition={{ duration: 0.45, ease: EASE }}
                              className="group flex items-start gap-2 rounded-xl border border-brand-surface-border bg-brand-surface-light/40 px-2 py-1.5 transition-colors hover:bg-white"
                            >
                              <motion.span
                                animate={reduceMotion ? {} : { scale: [1, 1.4, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                                className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${ACTIVITY_COLORS[a.type]}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-semibold text-brand-ink">{a.event}</p>
                                <p className="text-[9px] text-brand-ink-hint">{a.time} AM</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="absolute -bottom-3 left-4 right-4 -z-10 h-6 rounded-xl bg-brand-primary-deep/15 blur-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          OPERATIONS MODULES
         ────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <Reveal as="p" className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {t('m.home.modulesEyebrow')}
          </Reveal>
          <Reveal
            as="h2"
            delay={0.08}
            className="mx-auto mt-1.5 max-w-lg text-center text-xl font-black tracking-tight text-brand-ink sm:text-2xl"
          >
            {t('m.home.modulesTitle')}
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <motion.article
                  key={m.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.6, ease: EASE }}
                  whileHover={hoverLift}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-brand-surface-border bg-white p-5 transition-all hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary-deep/10"
                >
                  <motion.div
                    whileHover={reduceMotion ? {} : { rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${m.color} text-white shadow-sm`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </motion.div>
                  <h3 className="mt-3 text-sm font-black text-brand-ink">{t(`m.home.modules.${m.id}.title`)}</h3>
                  <p className="mt-1 text-[13px] font-medium leading-[1.5] text-brand-ink-muted">{t(`m.home.modules.${m.id}.desc`)}</p>
                  <div className={`absolute bottom-0 left-0 h-[2px] w-0 ${m.color} transition-all duration-500 group-hover:w-full`} />
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          RESERVATION LIFECYCLE
         ────────────────────────────────────────────── */}
      <section id="workflow" className="scroll-mt-20 border-t border-brand-surface-border bg-brand-surface">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <Reveal as="p" className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {t('m.home.workflowEyebrow')}
          </Reveal>
          <Reveal
            as="h2"
            delay={0.08}
            className="mx-auto mt-1.5 max-w-md text-center text-xl font-black tracking-tight text-brand-ink sm:text-2xl"
          >
            {t('m.home.workflowTitle')}
          </Reveal>

          <div className="relative mt-10">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
              style={{ originX: 0 }}
              className="absolute left-0 right-0 top-[30px] hidden h-[2px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent lg:block"
              aria-hidden="true"
            />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {WORKFLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="group flex flex-col items-center text-center"
                  >
                    <motion.div
                      whileHover={reduceMotion ? {} : { scale: 1.08, rotate: -3 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-2 border-brand-surface-border bg-white text-brand-ink shadow-sm transition-all group-hover:border-brand-primary/40 group-hover:shadow-md"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-sm">
                        {i + 1}
                      </span>
                    </motion.div>
                    <p className="mt-2.5 text-sm font-black text-brand-ink">{t(`m.home.wf.${step.id}.label`)}</p>
                    <p className="text-[11px] font-medium text-brand-ink-hint">{t(`m.home.wf.${step.id}.sub`)}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          PLATFORM CAPABILITIES
         ────────────────────────────────────────────── */}
      <section id="platform" className="scroll-mt-20 border-t border-brand-surface-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="lg:flex lg:items-center lg:gap-14">
            <Reveal className="lg:w-[340px] lg:flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint">{t('m.home.capsEyebrow')}</p>
              <h2 className="mt-1.5 text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
                {t('m.home.capsTitle')}
              </h2>
              <p className="mt-2 text-[0.85rem] font-medium leading-relaxed text-brand-ink-muted">
                {t('m.home.capsBio')}
              </p>
              <Link
                to="/login"
                className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink transition hover:text-brand-ink"
              >
                {t('m.home.capsCta')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
            </Reveal>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
              }}
              className="mt-8 grid flex-1 gap-3 sm:grid-cols-2 lg:mt-0"
            >
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.55, ease: EASE }}
                    whileHover={hoverLift}
                    className="flex gap-3 rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4 transition-all hover:border-brand-primary/30 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-primary-tint text-brand-ink">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-ink">{t(`m.home.cap.${cap.id}.label`)}</p>
                      <p className="mt-0.5 text-[12px] font-medium leading-snug text-brand-ink-muted">{t(`m.home.cap.${cap.id}.desc`)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          CTA BANNER
         ────────────────────────────────────────────── */}
      <section id="contact" className="scroll-mt-20 border-t border-brand-surface-border">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <Reveal
            variant="scale"
            className="flex flex-col items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)] px-8 py-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] sm:flex-row sm:text-left"
          >
            <div>
              <h3 className="text-lg font-black text-white">{t('m.home.banner.title')}</h3>
              <p className="mt-1 text-sm font-medium text-brand-ink-hint">{t('m.home.banner.sub')}</p>
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={reduceMotion ? {} : { scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink shadow-sm transition hover:bg-brand-primary-tint"
                >
                  <LogIn className="h-4 w-4" />
                  {t('m.home.banner.login')}
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? {} : { scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/bookings"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {t('m.home.banner.learn')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                </Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FOOTER (shared component)
         ────────────────────────────────────────────── */}
      <Footer
        loading={loading}
        connectionState={health ? 'connected' : 'disconnected'}
        timestamp={statusFetchedAt}
      />
    </div>
  );
}
