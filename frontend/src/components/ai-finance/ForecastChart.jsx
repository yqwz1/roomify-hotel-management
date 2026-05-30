import { LineChart } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { TrendLineChart } from '../charts/TrendLineChart';
import { ChartSkeleton } from '../charts/ChartSkeleton';
import { ChartEmptyState } from '../charts/ChartEmptyState';

const defaultFormatter = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);

const isFiniteNumber = (value) => Number.isFinite(Number(value));

// The historical trend chart spans 2 calendar years; ticks without a year are
// ambiguous (is "Jun 14" 2024 or 2025?). Include a 2-digit year on every tick.
const formatDateLabel = (value) => {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  }).format(date);
};

export default function ForecastChart({
  title,
  description,
  data = [],
  dateKey = 'date',
  valueKey,
  valueFormatter = defaultFormatter,
  emptyMessage = 'No trend data is available for this date range.',
  loading = false,
  error = null,
  accentClassName = 'text-brand-success',
  strokeColor = '#1D9E75',
  fillColor,
}) {
  if (loading) {
    return <ChartSkeleton height="h-72" className="rounded-[1.4rem]" />;
  }

  if (error) {
    return <ChartEmptyState variant="error" title="Trend data unavailable" message={error} className="rounded-[1.4rem]" />;
  }

  const points = Array.isArray(data)
    ? data
        .filter((item) => item && isFiniteNumber(item[valueKey]))
        .map((item) => ({
          date: item[dateKey],
          value: Number(item[valueKey]),
        }))
    : [];

  if (!points.length) {
    return (
      <EmptyState
        title={title || 'Trend data unavailable'}
        message={emptyMessage}
        icon={LineChart}
      />
    );
  }

  const latestPoint = [...points].reverse().find((point) => point.value > 0) ?? points[points.length - 1];
  const maxValue = Math.max(...points.map(p => p.value));
  const minValue = Math.min(...points.map(p => p.value));

  return (
    <Card className="rounded-[1.4rem] border border-brand-surface-border bg-white p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={cn('text-xs font-black uppercase tracking-[0.18em]', accentClassName)}>
              {title}
            </p>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-brand-ink-muted break-words">
              {description}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-hint break-words">
              Latest
            </p>
            <p className="mt-1 text-2xl font-black text-brand-ink break-words">
              {valueFormatter(latestPoint.value)}
            </p>
            <p className="mt-1 text-xs font-bold text-brand-ink-muted break-words">
              {formatDateLabel(latestPoint.date)}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-brand-surface-border bg-brand-surface-light p-3">
          <TrendLineChart
            data={points}
            xKey="date"
            yKey="value"
            variant="area"
            color={strokeColor}
            fillColor={fillColor}
            height={288}
            valueFormatter={valueFormatter}
            labelFormatter={formatDateLabel}
          />
        </div>

        <div className="mt-4 grid min-w-0 gap-3 text-sm font-bold text-brand-ink-muted sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            {points.length} points loaded
          </div>
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            High {valueFormatter(maxValue)}
          </div>
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            Low {valueFormatter(minValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
