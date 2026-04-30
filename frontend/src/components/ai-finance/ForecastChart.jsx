import { AlertTriangle, LineChart } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

const chartWidth = 640;
const chartHeight = 240;
const chartPadding = {
  top: 24,
  right: 24,
  bottom: 44,
  left: 56,
};

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

const buildCoordinates = (items) => {
  const values = items.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const baselineY = chartHeight - chartPadding.bottom;

  const coordinates = items.map((item, index) => {
    const x =
      items.length === 1
        ? chartPadding.left + innerWidth / 2
        : chartPadding.left + (index / (items.length - 1)) * innerWidth;
    const y =
      range === 0
        ? chartPadding.top + innerHeight / 2
        : chartPadding.top + innerHeight - ((item.value - minValue) / range) * innerHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = coordinates.length
    ? `${linePath} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${baselineY} L ${coordinates[0].x.toFixed(2)} ${baselineY} Z`
    : '';

  return {
    coordinates,
    linePath,
    areaPath,
    minValue,
    maxValue,
    baselineY,
  };
};

function ChartSkeleton() {
  return (
    <Card className="rounded-[1.4rem] border border-zinc-200 bg-white p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="animate-pulse">
          <div className="h-4 w-44 rounded-full bg-zinc-200" />
          <div className="mt-3 h-8 w-32 rounded-xl bg-zinc-200" />
          <div className="mt-6 h-56 rounded-[1.2rem] bg-zinc-100" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartError({ message }) {
  return (
    <Card className="rounded-[1.4rem] border border-rose-200 bg-rose-50 p-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-rose-950">Trend data unavailable</p>
            <p className="mt-1 text-sm font-medium leading-6 text-rose-900/80">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  fillColor = 'rgba(5, 150, 105, 0.14)',
}) {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return <ChartError message={error} />;
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

  const { coordinates, linePath, areaPath, minValue, maxValue, baselineY } = buildCoordinates(points);
  const latestPoint = [...points].reverse().find((point) => point.value > 0) ?? points[points.length - 1];
  const firstPoint = points[0];
  const middlePoint = points[Math.floor(points.length / 2)];
  const lastPoint = points[points.length - 1];
  const labelPoints = [firstPoint, middlePoint, lastPoint].filter(Boolean);
  const chartId = `${valueKey}-historical-chart`;

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
          <svg
            className="h-72 w-full"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            aria-labelledby={`${chartId}-title ${chartId}-description`}
            preserveAspectRatio="none"
          >
            <title id={`${chartId}-title`}>{title}</title>
            <desc id={`${chartId}-description`}>{description}</desc>
            {[0, 1, 2, 3].map((index) => {
              const y =
                chartPadding.top +
                (index / 3) * (chartHeight - chartPadding.top - chartPadding.bottom);
              return (
                <line
                  key={`grid-${index}`}
                  x1={chartPadding.left}
                  x2={chartWidth - chartPadding.right}
                  y1={y}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeDasharray="4 6"
                  strokeWidth="1"
                />
              );
            })}
            <text x="0" y={chartPadding.top + 4} className="fill-zinc-500 text-[11px] font-bold">
              {valueFormatter(maxValue)}
            </text>
            <text x="0" y={baselineY} className="fill-zinc-500 text-[11px] font-bold">
              {valueFormatter(minValue)}
            </text>
            {areaPath ? <path d={areaPath} fill={fillColor} stroke="none" /> : null}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            {coordinates.map((point, index) => {
              const showPoint =
                index === 0 ||
                index === coordinates.length - 1 ||
                point.date === latestPoint.date;

              return showPoint ? (
                <circle
                  key={`${point.date}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth="3"
                />
              ) : null;
            })}
            {labelPoints.map((point, index) => {
              const x =
                labelPoints.length === 1
                  ? chartPadding.left
                  : chartPadding.left +
                    (index / (labelPoints.length - 1)) *
                      (chartWidth - chartPadding.left - chartPadding.right);
              return (
                <text
                  key={`${point.date}-label-${index}`}
                  x={x}
                  y={chartHeight - 12}
                  textAnchor={index === 0 ? 'start' : index === labelPoints.length - 1 ? 'end' : 'middle'}
                  className="fill-zinc-500 text-[11px] font-bold"
                >
                  {formatDateLabel(point.date)}
                </text>
              );
            })}
          </svg>
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
