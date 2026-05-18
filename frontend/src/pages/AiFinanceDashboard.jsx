import {
  BarChart3,
  BedDouble,
  CalendarDays,
  Gauge,
  Hotel,
  LineChart,
  Percent,
  Receipt,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import AiFallbackBanner from '../components/ai-finance/AiFallbackBanner';
import AiInsightPanel from '../components/ai-finance/AiInsightPanel';
import AiStatusBanner from '../components/ai-finance/AiStatusBanner';
import ForecastChart from '../components/ai-finance/ForecastChart';
import PricingRecommendationCard from '../components/ai-finance/PricingRecommendationCard';
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

const formatConfidence = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return UNAVAILABLE;

  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(percent)}%`;
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

const getAiStatus = ({ aiHealth, modelInfo, loading }) => {
  if (loading && !aiHealth && !modelInfo) return 'PENDING';
  if (aiHealth?.status === 'UP') return 'ONLINE';
  if (aiHealth?.status === 'DOWN' && aiHealth?.fallbackAvailable) return 'SAFE_DEMO_FALLBACK';
  if (aiHealth?.status === 'DOWN') return 'OFFLINE';
  if (modelInfo?.status === 'AI_SERVICE_UNAVAILABLE') return 'OFFLINE';
  return 'PENDING';
};

const hasFallbackPayload = (payload) =>
  payload?.source === 'SAFE_DEMO_FALLBACK' || Boolean(payload?.warning);

const getFallbackMessage = (payload) =>
  payload?.warning || 'AI service is currently unavailable. Showing a safe demo fallback forecast.';

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

function ForecastMetricCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card className={cn('rounded-[1.35rem] border p-0 shadow-sm', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">
              {label}
            </p>
            <p className="mt-3 break-words text-2xl font-black tracking-tight">{value}</p>
            {hint ? <p className="mt-2 text-sm font-medium leading-6 opacity-75">{hint}</p> : null}
          </div>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastMetricSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`forecast-skeleton-${index}`} className="rounded-[1.35rem] border border-zinc-200 bg-white p-0 shadow-sm">
          <CardContent className="p-5">
            <div className="animate-pulse">
              <div className="h-3 w-28 rounded-full bg-zinc-200" />
              <div className="mt-4 h-8 w-32 rounded-xl bg-zinc-200" />
              <div className="mt-4 h-3 w-3/4 rounded-full bg-zinc-100" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AiFinanceContent() {
  const {
    loading,
    error,
    finalAiLoading,
    finalAiErrors,
    dataSummary,
    summary,
    revenueTrend,
    occupancyTrend,
    roomTypeRevenue,
    aiHealth,
    modelInfo,
    revenueForecast,
    pricingRecommendations,
    pricingRecommendationsResponse,
    askResponse,
    askLoading,
    askError,
    refresh,
    refreshFinalAiData,
    askAiFinance,
  } = useAiFinance();
  const dataSummaryCards = buildDataSummaryCards({ dataSummary, summary });
  const hasSummaryData = Boolean(dataSummary || summary || roomTypeRevenue.length);
  const revenueTrendError = !loading && error && revenueTrend.length === 0 ? error : null;
  const occupancyTrendError = !loading && error && occupancyTrend.length === 0 ? error : null;
  const forecastPoints = Array.isArray(revenueForecast?.points) ? revenueForecast.points : [];
  const hasPricingRecommendations = pricingRecommendations.length > 0;
  const aiStatus = getAiStatus({ aiHealth, modelInfo, loading: finalAiLoading });
  const aiStatusMessage = modelInfo?.message || (
    aiHealth?.status === 'DOWN'
      ? 'Spring Boot reports the AI service is down. Safe fallback responses may be available.'
      : undefined
  );
  const aiStatusSource = aiHealth?.status === 'UP'
    ? 'Spring Boot -> FastAPI'
    : 'Spring Boot';

  return (
    <>
      <DashboardPanel
        title="AI Status"
        description="Model readiness and fallback status loaded through the Manager-only Spring Boot API."
      >
        <AiStatusBanner
          status={aiStatus}
          modelType={modelInfo?.modelType}
          trainingRows={modelInfo?.trainingRows}
          lastTrained={modelInfo?.trainedAt}
          revenueMae={modelInfo?.revenueMae}
          occupancyMae={modelInfo?.occupancyMae}
          source={aiStatusSource}
          message={aiStatusMessage}
          loading={finalAiLoading}
          error={finalAiErrors['AI health'] || finalAiErrors['model info']}
        />
        {error && !hasSummaryData && !loading ? (
          <div className="mt-4">
            <ErrorState
              title="AI finance data unavailable"
              message={error}
              onRetry={refresh}
            />
          </div>
        ) : null}
        {aiHealth?.status === 'DOWN' || aiHealth?.fallbackAvailable ? (
          <AiFallbackBanner className="mt-4" />
        ) : null}
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
        description="Future revenue prediction from the Spring Boot AI Finance forecast endpoint, with historical context below."
      >
        <div className="space-y-5">
          {hasFallbackPayload(revenueForecast) ? (
            <AiFallbackBanner
              message={getFallbackMessage(revenueForecast)}
              source={revenueForecast?.source}
            />
          ) : null}
          {finalAiLoading ? (
            <ForecastMetricSkeletons />
          ) : finalAiErrors['revenue forecast'] && !revenueForecast ? (
            <ErrorState
              title="Revenue forecast unavailable"
              message={finalAiErrors['revenue forecast']}
              onRetry={refreshFinalAiData}
            />
          ) : revenueForecast ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <ForecastMetricCard
                  icon={WalletCards}
                  label={`Predicted Revenue Next ${revenueForecast.forecastDays || 30} Days`}
                  value={formatCurrency(revenueForecast.predictedRevenueTotal)}
                  hint={revenueForecast.source || 'Spring Boot AI Finance forecast'}
                  className="border-emerald-200 bg-emerald-50/85 text-emerald-950"
                />
                <ForecastMetricCard
                  icon={Percent}
                  label="Predicted Average Occupancy"
                  value={formatPercent(revenueForecast.predictedAverageOccupancy)}
                  hint="Future average occupancy from the forecast payload."
                  className="border-cyan-200 bg-cyan-50/85 text-cyan-950"
                />
                <ForecastMetricCard
                  icon={Gauge}
                  label="Confidence"
                  value={formatConfidence(revenueForecast.confidence)}
                  hint="Model confidence reported by the Spring endpoint."
                  className="border-violet-200 bg-violet-50/85 text-violet-950"
                />
              </div>
              <ForecastChart
                title="Predicted revenue next 30 days"
                description="Future forecast points returned by Spring Boot. This is the AI prediction, not historical data."
                data={forecastPoints}
                dateKey="date"
                valueKey="predictedRevenue"
                valueFormatter={formatCurrency}
                emptyMessage="No forecast revenue points were returned by the AI Finance endpoint."
                loading={false}
                error={null}
                accentClassName="text-emerald-700"
                strokeColor="hsl(var(--chart-2))"
              />
            </>
          ) : (
            <EmptyState
              title="Revenue forecast unavailable"
              message="The Spring Boot forecast endpoint did not return prediction data."
              icon={TrendingUp}
            />
          )}

          <ForecastChart
            title="Historical revenue trend"
            description="Historical daily revenue from Spring Boot analytics for comparison with the future forecast."
            data={revenueTrend}
            dateKey="date"
            valueKey="revenue"
            valueFormatter={formatCurrency}
            emptyMessage="No historical revenue points were returned for the selected analytics window."
            loading={loading}
            error={revenueTrendError}
            accentClassName="text-zinc-700"
            strokeColor="var(--legacy-zinc-600)"
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Occupancy Forecast"
        description="Future occupancy prediction from the Spring Boot AI Finance forecast endpoint, with historical context below."
      >
        <div className="space-y-5">
          {hasFallbackPayload(revenueForecast) ? (
            <AiFallbackBanner
              message={getFallbackMessage(revenueForecast)}
              source={revenueForecast?.source}
            />
          ) : null}
          {finalAiLoading ? (
            <ForecastMetricSkeletons />
          ) : finalAiErrors['revenue forecast'] && !revenueForecast ? (
            <ErrorState
              title="Occupancy forecast unavailable"
              message={finalAiErrors['revenue forecast']}
              onRetry={refreshFinalAiData}
            />
          ) : revenueForecast ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <ForecastMetricCard
                  icon={Percent}
                  label="Predicted Average Occupancy"
                  value={formatPercent(revenueForecast.predictedAverageOccupancy)}
                  hint={`Next ${revenueForecast.forecastDays || 30} days`}
                  className="border-sky-200 bg-sky-50/85 text-sky-950"
                />
                <ForecastMetricCard
                  icon={Gauge}
                  label="Confidence"
                  value={formatConfidence(revenueForecast.confidence)}
                  hint={revenueForecast.source || 'Spring Boot AI Finance forecast'}
                  className="border-violet-200 bg-violet-50/85 text-violet-950"
                />
                <ForecastMetricCard
                  icon={LineChart}
                  label="Forecast Points"
                  value={formatNumber(forecastPoints.length)}
                  hint="Daily future occupancy points loaded."
                  className="border-cyan-200 bg-cyan-50/85 text-cyan-950"
                />
              </div>
              <ForecastChart
                title="Predicted occupancy next 30 days"
                description="Future occupancy forecast points returned by Spring Boot. This is not the historical trend."
                data={forecastPoints}
                dateKey="date"
                valueKey="predictedOccupancy"
                valueFormatter={formatPercent}
                emptyMessage="No forecast occupancy points were returned by the AI Finance endpoint."
                loading={false}
                error={null}
                accentClassName="text-sky-700"
                strokeColor="hsl(var(--chart-1))"
              />
            </>
          ) : (
            <EmptyState
              title="Occupancy forecast unavailable"
              message="The Spring Boot forecast endpoint did not return occupancy prediction points."
              icon={Gauge}
            />
          )}

          <ForecastChart
            title="Historical occupancy trend"
            description="Historical occupancy rate from Spring Boot analytics for comparison with the future forecast."
            data={occupancyTrend}
            dateKey="date"
            valueKey="occupancyRate"
            valueFormatter={formatPercent}
            emptyMessage="No historical occupancy points were returned for the selected analytics window."
            loading={loading}
            error={occupancyTrendError}
            accentClassName="text-zinc-700"
            strokeColor="var(--legacy-zinc-600)"
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Pricing Recommendations"
        description="Advisory room-type pricing recommendations loaded through Spring Boot. No price changes are applied here."
      >
        <div className="space-y-4">
          {hasFallbackPayload(pricingRecommendationsResponse) ? (
            <AiFallbackBanner
              message={getFallbackMessage(pricingRecommendationsResponse)}
              source={pricingRecommendationsResponse?.source}
            />
          ) : null}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium leading-6 text-zinc-700">
            Recommendations are advisory only. Managers review them manually; this screen does not
            apply price changes.
          </div>
          {finalAiLoading ? (
            <ForecastMetricSkeletons />
          ) : finalAiErrors['pricing recommendations'] && !hasPricingRecommendations ? (
            <ErrorState
              title="Pricing recommendations unavailable"
              message={finalAiErrors['pricing recommendations']}
              onRetry={refreshFinalAiData}
            />
          ) : hasPricingRecommendations ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {pricingRecommendations.map((recommendation) => (
                <PricingRecommendationCard
                  key={recommendation.roomType}
                  {...recommendation}
                  source={pricingRecommendationsResponse?.source}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pricing recommendations"
              message="The Spring Boot pricing endpoint returned no room-type recommendations."
              icon={BarChart3}
            />
          )}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="AI Insights"
        description="Demo-safe insight buttons call Spring Boot predefined intents. Free-text chat is not required."
      >
        <AiInsightPanel
          response={askResponse}
          loading={askLoading}
          error={askError}
          onAskIntent={askAiFinance}
        />
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
        meta={['Manager only', 'Spring Boot AI bridge', 'Fallback ready']}
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
              <p className="mt-2 text-2xl font-black">Spring routed</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                Data mode
              </p>
              <p className="mt-2 text-2xl font-black">Live + fallback</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <AiFinanceContent />
    </div>
  );
}
