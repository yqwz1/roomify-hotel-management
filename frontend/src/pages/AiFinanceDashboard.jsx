import {
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  Gauge,
  Hotel,
  LineChart,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { cn } from '../lib/utils';

const summaryCards = [
  {
    label: 'Historical window',
    value: '18 months',
    hint: 'Reservations, payments, occupancy, and expenses',
    icon: CalendarDays,
    className: 'border-sky-200 bg-sky-50 text-sky-950',
  },
  {
    label: 'Forecast horizon',
    value: '30 days',
    hint: 'Revenue and occupancy projection range',
    icon: LineChart,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  {
    label: 'Projected revenue',
    value: 'SAR 128K',
    hint: 'Static placeholder until analytics APIs are connected',
    icon: WalletCards,
    className: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  {
    label: 'Projected occupancy',
    value: '74%',
    hint: 'Mock demand signal for manager review',
    icon: Gauge,
    className: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  },
];

const revenueBars = [
  { label: 'Week 1', value: 62 },
  { label: 'Week 2', value: 78 },
  { label: 'Week 3', value: 71 },
  { label: 'Week 4', value: 86 },
];

const occupancyBars = [
  { label: 'Standard', value: 68 },
  { label: 'Deluxe', value: 76 },
  { label: 'Suite', value: 82 },
  { label: 'Family', value: 64 },
];

const recommendations = [
  {
    roomType: 'Standard',
    currentRate: 'SAR 430',
    suggestedRate: 'SAR 455',
    signal: 'Moderate demand',
  },
  {
    roomType: 'Deluxe',
    currentRate: 'SAR 690',
    suggestedRate: 'SAR 745',
    signal: 'Strong weekend pickup',
  },
  {
    roomType: 'Suite',
    currentRate: 'SAR 980',
    suggestedRate: 'SAR 1,050',
    signal: 'Premium demand rising',
  },
];

const insights = [
  'Forecast cards currently use static data while the backend analytics contract is prepared.',
  'Pricing recommendations will stay bounded around current room-type base rates.',
  'Model confidence and training data freshness can be added once real AI endpoints exist.',
];

function SummaryCard({ icon: Icon, label, value, hint, className }) {
  return (
    <div className={cn('rounded-[1.5rem] border p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-sm font-medium leading-6 opacity-75">{hint}</p>
        </div>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function PlaceholderBarChart({ items, accentClassName }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-zinc-700">
            <span>{item.label}</span>
            <span>{item.value}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-zinc-100">
            <div
              className={cn('h-3 rounded-full', accentClassName)}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AiFinanceDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Header"
        title="AI Revenue Forecasting & Pricing Advisor"
        description="Manager workspace for revenue projections, occupancy demand signals, pricing recommendations, and AI finance insights."
        className="border-cyan-400/10 bg-[linear-gradient(135deg,#111827_0%,#0f766e_50%,#164e63_100%)]"
        meta={['Manager only', 'Static mock data', 'Backend integration pending']}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            Advisor Snapshot
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                Model status
              </p>
              <p className="mt-2 text-2xl font-black">Ready</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                Last refresh
              </p>
              <p className="mt-2 text-2xl font-black">Demo</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title="AI Status"
        description="A lightweight status area for the future forecasting service connection."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-900 shadow-sm">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-emerald-950">Frontend ready</p>
                <p className="mt-1 text-sm font-medium text-emerald-900/75">No live AI calls yet</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-900 shadow-sm">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-sky-950">Model placeholder</p>
                <p className="mt-1 text-sm font-medium text-sky-900/75">Mock response contract only</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-900 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-amber-950">Advisor mode</p>
                <p className="mt-1 text-sm font-medium text-amber-900/75">Static manager preview</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Data Summary Cards"
        description="Placeholder finance and demand metrics for the first UI pass."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Revenue Forecast"
        description="Static forecast shape for the future revenue prediction endpoint."
      >
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              30-day outlook
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight text-zinc-950">+12%</p>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-600">
              Mock uplift compared with the previous 30-day period.
            </p>
          </div>
          <PlaceholderBarChart items={revenueBars} accentClassName="bg-emerald-500" />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Occupancy Forecast"
        description="Static demand-by-room-type view for the future occupancy forecast."
      >
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <PlaceholderBarChart items={occupancyBars} accentClassName="bg-sky-500" />
          <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-900 shadow-sm">
                <Hotel className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                  Peak segment
                </p>
                <p className="mt-1 text-xl font-black text-sky-950">Suite rooms</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-sky-900/80">
              Placeholder demand signal based on static demo values.
            </p>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Pricing Recommendations"
        description="Mock room-type rate suggestions for the manager dashboard."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((item) => (
            <div
              key={item.roomType}
              className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-zinc-950">{item.roomType}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">{item.signal}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.15rem] border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                    Current
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{item.currentRate}</p>
                </div>
                <div className="rounded-[1.15rem] border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    Suggested
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-950">{item.suggestedRate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="AI Insights"
        description="Placeholder narrative cards for the future AI finance assistant."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map((insight) => (
            <div
              key={insight}
              className="rounded-[1.4rem] border border-cyan-200 bg-cyan-50 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-900 shadow-sm">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium leading-6 text-cyan-950">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
