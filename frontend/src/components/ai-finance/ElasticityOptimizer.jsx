import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Gauge, MoveHorizontal, Sparkles, WalletCards } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { Card, CardContent } from '../ui/card';
import { ChartTooltipContent } from '../ui/chart';
import { Slider } from '../ui/slider';

import { Button } from "@/components/ui/button";
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatPercent = (value) =>
  `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Number(value) || 0)}%`;

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <Card className="rounded-[1.35rem] border border-brand-surface-border bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
              {label}
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-brand-ink break-words">{value}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted break-words">{hint}</p>
          </div>
          <span className="inline-flex min-w-0 h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary break-words">
            <Icon className="h-5 w-5 shrink-0" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricChart({ title, children }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
      <div className="mb-4">
        <h4 className="text-sm font-black tracking-tight text-brand-ink break-words">{title}</h4>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ElasticityOptimizer({
  forecasts,
  loading,
  error,
  onRetry,
  selectedRoomTypeId,
  onSelectRoomType,
  sliderIndex,
  onSliderChange,
}) {
  if (loading) {
    return (
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`elasticity-skeleton-${index}`}
            className="h-72 animate-pulse rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light"
          />
        ))}
      </div>
    );
  }

  if (error && (!Array.isArray(forecasts) || forecasts.length === 0)) {
    return (
      <ErrorState
        title="Elasticity simulation unavailable"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!Array.isArray(forecasts) || forecasts.length === 0) {
    return (
      <EmptyState
        title="No price optimization data"
        message="The elasticity engine has not returned any room-type simulation results yet."
        icon={Sparkles}
      />
    );
  }

  const selectedForecast =
    forecasts.find((forecast) => forecast.roomTypeId === selectedRoomTypeId) || forecasts[0];
  const simulations = Array.isArray(selectedForecast?.priceSimulations)
    ? selectedForecast.priceSimulations
    : [];
  const boundedSliderIndex = Math.min(Math.max(sliderIndex, 0), Math.max(simulations.length - 1, 0));
  const selectedSimulation = simulations[boundedSliderIndex] || simulations[0];

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-wrap gap-2">
        {forecasts.map((forecast) => (
          <Button variant="unstyled" size="none"
            key={forecast.roomTypeId}
            type="button"
            onClick={() => onSelectRoomType(forecast.roomTypeId)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              forecast.roomTypeId === selectedForecast.roomTypeId
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-brand-surface-border bg-white text-brand-ink hover:border-brand-primary/35'
            }`}
          >
            {forecast.roomType}
          </Button>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Sparkles}
          label="Optimal Price"
          value={formatCurrency(selectedForecast.optimalPrice)}
          hint={`AI-selected best profit point across ${selectedForecast.forecastDays} forecast days.`}
        />
        <MetricCard
          icon={MoveHorizontal}
          label="Selected Price"
          value={formatCurrency(selectedSimulation?.price)}
          hint={`Price delta ${formatPercent(selectedSimulation?.deltaPercentage || 0)} relative to current.`}
        />
        <MetricCard
          icon={Gauge}
          label="Expected Occupancy"
          value={formatPercent(selectedSimulation?.occupancy)}
          hint={`${selectedSimulation?.expectedBookings || 0} expected room-night bookings for the period.`}
        />
        <MetricCard
          icon={WalletCards}
          label="Expected Profit"
          value={formatCurrency(selectedSimulation?.profit)}
          hint={`Confidence ${formatPercent((selectedForecast.confidenceScore || 0) * 100)}.`}
        />
      </div>

      <div className="rounded-[1.5rem] border border-brand-surface-border bg-white p-5 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-base font-black tracking-tight text-brand-ink break-words">
              {selectedForecast.roomType} price simulator
            </h4>
            <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">
              Move the slider to inspect the modelled occupancy, revenue, and profit at each tested
              price point.
            </p>
          </div>
          <div className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-bold text-brand-primary">
            Current price: {formatCurrency(selectedForecast.currentPrice)}
          </div>
        </div>

        <div className="mt-5">
          <Slider
            min={0}
            max={Math.max(simulations.length - 1, 0)}
            step={1}
            value={[boundedSliderIndex]}
            onValueChange={([value]) => onSliderChange(Number(value))}
            className="[&_[role=slider]]:border-brand-primary [&_[role=slider]]:bg-white [&_[data-orientation=horizontal]]:bg-brand-surface-border [&_[data-orientation=horizontal]>span]:bg-brand-primary"
          />
          <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink-muted">
            {simulations.map((simulation) => (
              <span
                key={`${selectedForecast.roomType}-${simulation.price}`}
                className={simulation.recommended ? 'text-brand-success' : undefined}
              >
                {formatCurrency(simulation.price)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <MetricChart title="Elasticity overview">
          <ComposedChart data={simulations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EC" />
            <XAxis dataKey="price" tickFormatter={(value) => `SAR ${value}`} />
            <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `SAR ${value}`} />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === 'occupancy' ? formatPercent(value) : formatCurrency(value)
                  }
                />
              }
            />
            <Legend />
            <Bar yAxisId="right" dataKey="profit" name="Profit" fill="#1D9E75" radius={[8, 8, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="occupancy" name="Occupancy" stroke="#35658D" strokeWidth={3} dot={{ r: 4 }} />
            <ReferenceLine yAxisId="right" x={selectedSimulation?.price} stroke="#C28643" strokeDasharray="4 4" />
          </ComposedChart>
        </MetricChart>

        <MetricChart title="Revenue vs price">
          <AreaChart data={simulations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EC" />
            <XAxis dataKey="price" tickFormatter={(value) => `SAR ${value}`} />
            <YAxis tickFormatter={(value) => `SAR ${value}`} />
            <Tooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} />
            <Area type="monotone" dataKey="revenue" stroke="#C28643" fill="rgba(194,134,67,0.18)" strokeWidth={3} />
            <ReferenceLine x={selectedForecast.optimalPrice} stroke="#1D9E75" strokeDasharray="4 4" />
          </AreaChart>
        </MetricChart>

        <MetricChart title="Occupancy vs price">
          <LineChart data={simulations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EC" />
            <XAxis dataKey="price" tickFormatter={(value) => `SAR ${value}`} />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<ChartTooltipContent formatter={(value) => formatPercent(value)} />} />
            <Line type="monotone" dataKey="occupancy" stroke="#35658D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <ReferenceLine x={selectedSimulation?.price} stroke="#C28643" strokeDasharray="4 4" />
          </LineChart>
        </MetricChart>

        <MetricChart title="Profit optimization">
          <BarChart data={simulations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EC" />
            <XAxis dataKey="price" tickFormatter={(value) => `SAR ${value}`} />
            <YAxis tickFormatter={(value) => `SAR ${value}`} />
            <Tooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value)} />} />
            <Bar dataKey="profit" fill="#1D9E75" radius={[8, 8, 0, 0]} />
            <ReferenceLine x={selectedForecast.optimalPrice} stroke="#1A2B3A" strokeDasharray="4 4" />
          </BarChart>
        </MetricChart>
      </div>

      {error ? (
        <div className="rounded-2xl border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-brand-success/25 bg-brand-success/10 p-5 text-sm font-medium leading-7 text-brand-ink">
        Recommended action for <span className="font-black break-words">{selectedForecast.roomType}</span>:
        move from {` ${formatCurrency(selectedForecast.currentPrice)} `}to
        <span className="font-black text-brand-success break-words"> {formatCurrency(selectedForecast.optimalPrice)} </span>
        for an expected profit of {formatCurrency(selectedForecast.expectedProfit)} and expected occupancy of{' '}
        {formatPercent(selectedForecast.expectedOccupancy)}.
      </div>
    </div>
  );
}
