import {
  AlertTriangle,
  BarChart3,
  BedDouble,
  Bot,
  BrainCircuit,
  CalendarDays,
  Gauge,
  Hotel,
  Receipt,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ForecastChart from '../components/ai-finance/ForecastChart';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { Card, CardContent } from '../components/ui/card';
import { useAiFinance } from '../hooks/useAiFinance';
import { cn } from '../lib/utils';

const UNAVAILABLE = 'Unavailable';

const isPresent = (value) => value !== null && value !== undefined && value !== '';

const formatNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat('en-US').format(numeric) : UNAVAILABLE;
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(numeric)
    : UNAVAILABLE;
};

const formatPercent = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric)}%`
    : UNAVAILABLE;
};

const formatDateRange = (start, end) =>
  isPresent(start) && isPresent(end) ? `${start} to ${end}` : 'Date range unavailable';

const buildDataSummaryCards = ({ dataSummary, summary }) => [
  {
    label: 'Reservations',
    value: formatNumber(dataSummary?.reservations),
    hint: isPresent(dataSummary?.payments)
      ? `${formatNumber(dataSummary.payments)} payments included in the analytics dataset.`
      : 'Reservation count from Spring Boot analytics.',
    icon: CalendarDays,
    className: 'border-sky-200 bg-sky-50/85 text-sky-950',
  },
  {
    label: 'Revenue',
    value: formatCurrency(dataSummary?.totalRevenue),
    hint: formatDateRange(dataSummary?.dateRangeStart, dataSummary?.dateRangeEnd),
    icon: WalletCards,
    className: 'border-amber-200 bg-amber-50/85 text-amber-950',
  },
  {
    label: 'Occupancy',
    value: formatPercent(summary?.currentOccupancy ?? dataSummary?.averageOccupancy),
    hint: isPresent(summary?.currentOccupancy)
      ? 'Current occupancy from the finance summary endpoint.'
      : 'Average occupancy across the analytics dataset.',
    icon: Gauge,
    className: 'border-cyan-200 bg-cyan-50/85 text-cyan-950',
  },
  {
    label: 'Expenses',
    value: formatCurrency(summary?.totalExpenses),
    hint: isPresent(summary?.netProfit)
      ? `${formatCurrency(summary.netProfit)} net profit after expenses.`
      : 'Expense total from the finance summary endpoint.',
    icon: Receipt,
    className: 'border-rose-200 bg-rose-50/85 text-rose-950',
  },
  {
    label: 'Room Types',
    value: formatNumber(dataSummary?.roomTypes),
    hint: 'Room-type count available to AI Finance analytics.',
    icon: BedDouble,
    className: 'border-violet-200 bg-violet-50/85 text-violet-950',
  },
  {
    label: 'Top Room Type',
    value: summary?.topRoomType || UNAVAILABLE,
    hint: 'Top-performing room type from the summary endpoint.',
    icon: Hotel,
    className: 'border-emerald-200 bg-emerald-50/85 text-emerald-950',
  },
];

const aiStatusItems = [
  {
    icon: Bot,
    title: 'Spring Boot analytics connected',
    description: 'Day 4 summary cards load through the authenticated backend API.',
    className: 'border-emerald-200 bg-emerald-50/85 text-emerald-950',
  },
  {
    icon: BrainCircuit,
    title: 'Model service pending',
    description: 'Forecast and pricing AI calls remain reserved for later integration days.',
    className: 'border-sky-200 bg-sky-50/85 text-sky-950',
  },
  {
    icon: AlertTriangle,
    title: 'Demo-safe mode',
    description: 'No pricing recommendation is applied from this Day 4 screen.',
    className: 'border-amber-200 bg-amber-50/85 text-amber-950',
  },
];

const insights = [
  'Summary cards are now populated from Spring Boot AI Finance analytics.',
  'Historical trend APIs are loaded for Day 4 readiness; forecast chart work can build on them later.',
  'Pricing recommendations and assistant answers remain intentionally disconnected for later days.',
];

function DataSummaryCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card className={cn('rounded-[1.5rem] border p-0 shadow-sm', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
              {label}
            </p>
            <p className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">
              {value}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 opacity-75">{hint}</p>
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DataSummarySkeletonCard() {
  return (
    <Card className="rounded-[1.5rem] border border-zinc-200 bg-white p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 animate-pulse">
            <div className="h-3 w-24 rounded-full bg-zinc-200" />
            <div className="mt-4 h-8 w-28 rounded-xl bg-zinc-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-full bg-zinc-100" />
              <div className="h-3 w-3/4 rounded-full bg-zinc-100" />
            </div>
          </div>
          <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-2xl bg-zinc-100" />
        </div>
      </CardContent>
    </Card>
  );
}

function DataSummaryCards({ cards, loading }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 6 }).map((_, index) => (
            <DataSummarySkeletonCard key={`summary-skeleton-${index}`} />
          ))
        : cards.map((card) => (
            <DataSummaryCard key={card.label} {...card} />
          ))}
    </div>
  );
}

function StatusCard({ icon: Icon, title, description, className }) {
  return (
    <div className={cn('rounded-[1.4rem] border p-5', className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-sm font-medium leading-6 opacity-75">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AiFinanceContent() {
  const {
    loading,
    error,
    dataSummary,
    summary,
    revenueTrend,
    occupancyTrend,
    roomTypeRevenue,
    refresh,
  } = useAiFinance();
  const dataSummaryCards = buildDataSummaryCards({ dataSummary, summary });
  const hasSummaryData = Boolean(dataSummary || summary || roomTypeRevenue.length);
  const revenueTrendError = !loading && error && revenueTrend.length === 0 ? error : null;
  const occupancyTrendError = !loading && error && occupancyTrend.length === 0 ? error : null;

  return (
    <>
      <DashboardPanel
        title="AI Status"
        description="Readiness indicators for Day 4 Spring Boot analytics and future AI service connection."
      >
        {error && !hasSummaryData && !loading ? (
          <ErrorState
            title="AI finance data unavailable"
            message={error}
            onRetry={refresh}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {aiStatusItems.map((item) => (
              <StatusCard key={item.title} {...item} />
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Data Summary Cards"
        description="Live finance and demand metrics from Spring Boot AI Finance endpoints."
      >
        {error && hasSummaryData ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Some AI Finance data could not be refreshed. Showing the backend values that loaded successfully.
          </div>
        ) : null}
        {!loading && !hasSummaryData ? (
          <EmptyState
            title="No AI finance summary data"
            message="The backend returned no summary records for the current analytics window."
            icon={Sparkles}
          />
        ) : (
          <DataSummaryCards cards={dataSummaryCards} loading={loading} />
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Revenue Forecast"
        description="Historical revenue trend loaded from Spring Boot analytics. AI forecast prediction comes in a later integration."
      >
        <ForecastChart
          title="Historical revenue trend"
          description="Daily revenue returned by Spring Boot analytics for the verified training window."
          data={revenueTrend}
          dateKey="date"
          valueKey="revenue"
          valueFormatter={formatCurrency}
          emptyMessage="No historical revenue points were returned for the selected analytics window."
          loading={loading}
          error={revenueTrendError}
          accentClassName="text-emerald-700"
          strokeColor="#059669"
          fillColor="rgba(5, 150, 105, 0.14)"
        />
      </DashboardPanel>

      <DashboardPanel
        title="Occupancy Forecast"
        description="Historical occupancy trend loaded from Spring Boot analytics. AI forecast prediction comes in a later integration."
      >
        <ForecastChart
          title="Historical occupancy trend"
          description="Daily occupancy rate returned by Spring Boot analytics for the verified training window."
          data={occupancyTrend}
          dateKey="date"
          valueKey="occupancyRate"
          valueFormatter={formatPercent}
          emptyMessage="No historical occupancy points were returned for the selected analytics window."
          loading={loading}
          error={occupancyTrendError}
          accentClassName="text-sky-700"
          strokeColor="#0284c7"
          fillColor="rgba(2, 132, 199, 0.14)"
        />
      </DashboardPanel>

      <DashboardPanel
        title="Pricing Recommendations"
        description="Day 7 pricing recommendations are intentionally not connected in this Day 4 task."
      >
        <EmptyState
          title="Pricing recommendations pending"
          message="No recommendation values are shown until the later Spring Boot pricing advisor integration is ready."
          icon={TrendingUp}
        />
      </DashboardPanel>

      <DashboardPanel
        title="AI Insights"
        description="Placeholder narrative cards for the future AI finance assistant."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map((insight) => (
            <div
              key={insight}
              className="rounded-[1.4rem] border border-cyan-200 bg-cyan-50/85 p-5"
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
    </>
  );
}

export default function AiFinanceDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow="Header"
        title="AI Revenue Forecasting & Pricing Advisor"
        description="Manager workspace for revenue projections, occupancy demand signals, pricing recommendations, and AI finance insights."
        className="border-cyan-400/10 bg-[linear-gradient(135deg,#111827_0%,#0f766e_52%,#164e63_100%)]"
        meta={['Manager only', 'Spring Boot analytics', 'AI model pending']}
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
              <p className="mt-2 text-2xl font-black">Pending</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                Data mode
              </p>
              <p className="mt-2 text-2xl font-black">Live</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <AiFinanceContent />
    </div>
  );
}
