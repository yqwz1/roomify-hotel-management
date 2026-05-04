import { useEffect, useMemo, useState } from 'react';
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
import Footer from '../components/Footer';
import { checkHealth } from '../services/healthService';
import { useAuth } from '../context/AuthProvider';
import { getDefaultRouteForRoles } from '../components/navigation/navConfig';

/* ════════════════════════════════════════════════════════════
   MOCK DATA — visual only, no API calls
   ════════════════════════════════════════════════════════════ */

const LIVE_STATS = [
  { label: 'Total Rooms', value: '120', icon: BedDouble, color: 'text-zinc-700' },
  { label: 'Occupied', value: '87', icon: CheckCircle2, color: 'text-zinc-950' },
  { label: 'Available', value: '24', icon: Clock, color: 'text-emerald-700' },
  { label: 'Maintenance', value: '9', icon: Clock, color: 'text-amber-700' },
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
  occupied: { bg: 'bg-zinc-800', label: 'Occupied' },
  available: { bg: 'bg-emerald-600', label: 'Available' },
  checkout: { bg: 'bg-amber-500', label: 'Due Out' },
  maintenance: { bg: 'bg-zinc-400', label: 'Maint.' },
};

const TODAY_ACTIVITY = [
  { time: '07:15', event: 'Room 302 — Checkout completed', type: 'checkout' },
  { time: '08:30', event: 'Room 110 — Sara Noor checked in', type: 'checkin' },
  { time: '09:00', event: 'Room 204 — Reservation confirmed', type: 'reservation' },
  { time: '09:45', event: 'Room 107 — Maintenance requested', type: 'maintenance' },
  { time: '10:20', event: 'Invoice #1047 — Generated for Room 302', type: 'invoice' },
];

const ACTIVITY_COLORS = {
  checkout: 'bg-amber-400',
  checkin: 'bg-emerald-500',
  reservation: 'bg-zinc-600',
  maintenance: 'bg-zinc-400',
  invoice: 'bg-zinc-800',
};

const MODULES = [
  {
    icon: CalendarClock,
    title: 'Reservations',
    desc: 'Full booking lifecycle — create, modify, confirm, and cancel reservations with real-time availability.',
    color: 'bg-zinc-950',
  },
  {
    icon: BedDouble,
    title: 'Room Operations',
    desc: 'Live room board, housekeeping status, maintenance tracking, and floor-level visibility.',
    color: 'bg-emerald-700',
  },
  {
    icon: Receipt,
    title: 'Billing & Invoicing',
    desc: 'Guest folios, charge posting, invoice generation, payment tracking, and checkout settlement.',
    color: 'bg-amber-700',
  },
  {
    icon: BarChart3,
    title: 'Manager Insights',
    desc: 'Occupancy trends, revenue reports, expense tracking, and AI-powered financial analysis.',
    color: 'bg-zinc-700',
  },
];

const WORKFLOW = [
  { icon: Search, label: 'Search', sub: 'Find rooms' },
  { icon: CalendarClock, label: 'Reserve', sub: 'Book room' },
  { icon: ClipboardCheck, label: 'Check-in', sub: 'Arrive guest' },
  { icon: CreditCard, label: 'Charges', sub: 'Post items' },
  { icon: FileText, label: 'Invoice', sub: 'Generate bill' },
  { icon: DoorOpen, label: 'Checkout', sub: 'Settle & depart' },
];

const CAPABILITIES = [
  { icon: Shield, label: 'Role-based access', desc: 'Admin, Manager, Staff, and Guest dashboards' },
  { icon: Users, label: 'Multi-staff operations', desc: 'Concurrent front-desk and back-office workflows' },
  { icon: TrendingUp, label: 'Real-time visibility', desc: 'Live occupancy, revenue, and room status' },
  { icon: Sparkles, label: 'AI-powered insights', desc: 'Financial analysis and performance forecasting' },
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

  return (
    <div className="min-h-full bg-[#f7f3ed]">

      {/* ──────────────────────────────────────────────
          HERO
         ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-zinc-200/40 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-zinc-100/50 to-transparent blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-10 sm:px-8 lg:px-10 lg:pb-10 lg:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">

            {/* LEFT — Copy */}
            <div className="flex flex-col justify-center lg:pt-4">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 shadow-sm">
                Property Management System
              </div>

              <h1 className="mt-4 text-[1.75rem] font-black leading-[1.2] tracking-tight text-zinc-950 sm:text-[2rem] lg:text-[2.35rem]">
                The operating system for your&nbsp;hotel
              </h1>

              <p className="mt-3 max-w-md text-[0.9rem] font-medium leading-relaxed text-zinc-500">
                Manage reservations, rooms, guests, billing, and staff operations — all from one platform built for hotel teams.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  to="/login"
                  id="hero-login-cta"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-zinc-950/20 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-950/25"
                >
                  <LogIn className="h-4 w-4" />
                  Login to Dashboard
                </Link>
                <Link
                  to="/bookings"
                  id="hero-booking-cta"
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  Booking Support
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Quick stat chips */}
              <div className="mt-7 flex flex-wrap gap-4 border-t border-zinc-200 pt-5">
                {LIVE_STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                        <span className="text-xs font-medium text-zinc-400">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — App Mockup */}
            <div className="relative">
              <div className="rounded-[1.75rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 ring-1 ring-zinc-900/[0.03]">
                {/* Window chrome */}
                <div className="flex items-center gap-2 rounded-t-[1.75rem] border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="ml-2 flex-1 rounded-full bg-white/80 border border-zinc-200/60 px-3 py-1 text-[10px] text-zinc-400 font-mono">
                    app.roomify.io/dashboard
                  </div>
                </div>

                {/* Mock app body */}
                <div className="flex min-h-[340px] sm:min-h-[380px]">
                  {/* Sidebar */}
                  <div className="hidden w-[140px] flex-shrink-0 border-r border-zinc-100 bg-zinc-950 p-3 sm:block rounded-bl-[1.75rem]">
                    <div className="mb-4 flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-white">Roomify</span>
                    </div>
                    {['Dashboard', 'Reservations', 'Rooms', 'Guests', 'Billing', 'Reports'].map((item, i) => (
                      <div
                        key={item}
                        className={`mb-0.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${
                          i === 0 ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Main area */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Occupancy', val: '72%', sub: '+4% vs last week', accent: 'text-zinc-950' },
                        { label: 'Rev Today', val: '$4,280', sub: '18 transactions', accent: 'text-emerald-700' },
                        { label: 'Arrivals', val: '8', sub: '3 pending', accent: 'text-amber-700' },
                        { label: 'Departures', val: '5', sub: '2 late checkout', accent: 'text-zinc-700' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-2.5 py-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{s.label}</p>
                          <p className={`text-base font-black leading-tight ${s.accent}`}>{s.val}</p>
                          <p className="mt-0.5 text-[9px] text-zinc-400 hidden sm:block">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.85fr]">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Room Board</span>
                          <div className="flex gap-2">
                            {Object.entries(ROOM_STATUS_MAP).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${val.bg}`} />
                                <span className="text-[8px] text-zinc-400">{val.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-8 gap-1">
                          {ROOM_GRID.map((r) => (
                            <div
                              key={r.num}
                              className={`flex h-8 items-center justify-center rounded-lg text-[9px] font-bold text-white ${ROOM_STATUS_MAP[r.status].bg} transition-transform hover:scale-110`}
                              title={`${r.num} — ${ROOM_STATUS_MAP[r.status].label}`}
                            >
                              {r.num}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-500">Live Activity</span>
                        <div className="space-y-1">
                          {TODAY_ACTIVITY.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50/40 px-2 py-1.5">
                              <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${ACTIVITY_COLORS[a.type]}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-semibold text-zinc-700">{a.event}</p>
                                <p className="text-[9px] text-zinc-400">{a.time} AM</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 left-4 right-4 -z-10 h-6 rounded-xl bg-zinc-300/30 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          OPERATIONS MODULES
         ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Core Modules</p>
          <h2 className="mx-auto mt-1.5 max-w-lg text-center text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            Everything a hotel needs to operate
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <article
                  key={m.title}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/60"
                >
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${m.color} text-white shadow-sm`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="mt-3 text-sm font-black text-zinc-950">{m.title}</h3>
                  <p className="mt-1 text-[13px] font-medium leading-[1.5] text-zinc-500">{m.desc}</p>
                  <div className={`absolute bottom-0 left-0 h-[2px] w-full ${m.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          RESERVATION LIFECYCLE
         ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-200 bg-[#f7f3ed]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Guest Journey</p>
          <h2 className="mx-auto mt-1.5 max-w-md text-center text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            Reservation lifecycle, start to finish
          </h2>

          <div className="relative mt-10">
            <div className="absolute left-0 right-0 top-[30px] hidden h-[2px] bg-gradient-to-r from-transparent via-zinc-300 to-transparent lg:block" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {WORKFLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="group flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all group-hover:border-zinc-400 group-hover:shadow-md">
                      <Icon className="h-6 w-6" />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white shadow-sm">
                        {i + 1}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm font-black text-zinc-900">{step.label}</p>
                    <p className="text-[11px] font-medium text-zinc-400">{step.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          PLATFORM CAPABILITIES
         ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="lg:flex lg:items-center lg:gap-14">
            <div className="lg:w-[340px] lg:flex-shrink-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Platform</p>
              <h2 className="mt-1.5 text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
                Built for hotel operations teams
              </h2>
              <p className="mt-2 text-[0.85rem] font-medium leading-relaxed text-zinc-500">
                Roomify is designed for how hotels actually work — from front desk to back office.
              </p>
              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-zinc-950 transition hover:text-zinc-700"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid flex-1 gap-3 sm:grid-cols-2 lg:mt-0">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div key={cap.label} className="flex gap-3 rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900">{cap.label}</p>
                      <p className="mt-0.5 text-[12px] font-medium leading-snug text-zinc-500">{cap.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          CTA BANNER
         ────────────────────────────────────────────── */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)] px-8 py-7 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] sm:flex-row sm:text-left">
            <div>
              <h3 className="text-lg font-black text-white">Ready to streamline hotel operations?</h3>
              <p className="mt-1 text-sm font-medium text-zinc-400">Login to your dashboard or contact us for a demo.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-sm transition hover:bg-zinc-100"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/bookings"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Learn more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
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
