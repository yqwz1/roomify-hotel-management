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

const formatDateLabel = (value) => {
  if (!value) return '';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
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
  accentClassName = 'text-emerald-700',
  strokeColor = '#059669',
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
    <Card className="rounded-[1.4rem] border border-zinc-200 bg-white p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={cn('text-xs font-black uppercase tracking-[0.18em]', accentClassName)}>
              {title}
            </p>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-600">
              {description}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-zinc-100 bg-zinc-50 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
              Latest
            </p>
            <p className="mt-1 text-2xl font-black text-zinc-950">
              {valueFormatter(latestPoint.value)}
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-500">
              {formatDateLabel(latestPoint.date)}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-zinc-100 bg-zinc-50 p-3">
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

        <div className="mt-4 grid gap-3 text-sm font-bold text-zinc-600 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            {points.length} points loaded
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            High {valueFormatter(maxValue)}
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            Low {valueFormatter(minValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
