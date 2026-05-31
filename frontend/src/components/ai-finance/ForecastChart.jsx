import { LineChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../common/EmptyState';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { TrendLineChart } from '../charts/TrendLineChart';
import { ChartSkeleton } from '../charts/ChartSkeleton';
import { ChartEmptyState } from '../charts/ChartEmptyState';
import { getLocale, formatLocalizedDate } from '../../utils/localization';
import { seasonFullLabel } from '../../utils/seasonLabels';

const defaultFormatter = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);

const isFiniteNumber = (value) => Number.isFinite(Number(value));

// Local-midnight epoch-ms for a "YYYY-MM-DD" string, matching the axis formatter
// below so the line points and the season bands share identical timestamp units.
const toTimestamp = (isoDate) => {
  if (!isoDate) return NaN;
  return new Date(`${isoDate}T00:00:00`).getTime();
};

// The historical trend chart spans 2 calendar years; ticks without a year are
// ambiguous (is "Jun 14" 2024 or 2025?). Include a 2-digit year on every tick.
// Forced to the Gregorian calendar in BOTH locales so the axis stays one consistent
// time reference that matches the Gregorian-indexed data and bands — Arabic still gets
// Arabic month names + Arabic-Indic digits, just Gregorian months. Accepts either a
// "YYYY-MM-DD" string (category axis) or an epoch-ms number (time-scale axis).
const TREND_DATE_OPTS = { month: 'short', day: 'numeric', year: '2-digit', calendar: 'gregory' };

const formatTrendDate = (value, language) => {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '';
    return new Intl.DateTimeFormat(getLocale(language), TREND_DATE_OPTS).format(new Date(value));
  }
  return formatLocalizedDate(value, language, TREND_DATE_OPTS);
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
  seasons = [],
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const dateFormatter = (value) => formatTrendDate(value, language);

  if (loading) {
    return <ChartSkeleton height="h-72" className="rounded-[1.4rem]" />;
  }

  if (error) {
    return <ChartEmptyState variant="error" title="Trend data unavailable" message={error} className="rounded-[1.4rem]" />;
  }

  const seasonSegments = Array.isArray(seasons) ? seasons : [];
  const hasSeasons = seasonSegments.length > 0;

  // Localized season label covering an ISO date (segment ranges are inclusive).
  const seasonNameForDate = (isoDate) => {
    const segment = seasonSegments.find(
      (s) => isoDate >= s.startDate && isoDate <= s.endDate
    );
    return segment ? seasonFullLabel(segment, t, language) : undefined;
  };

  const points = Array.isArray(data)
    ? data
        .filter((item) => item && isFiniteNumber(item[valueKey]))
        .map((item) => {
          const isoDate = item[dateKey];
          return {
            date: isoDate,
            // Every point carries `ts` so the time-scale axis and the season
            // ReferenceArea bands align on identical epoch-ms units.
            ts: toTimestamp(isoDate),
            value: Number(item[valueKey]),
            seasonName: hasSeasons ? seasonNameForDate(isoDate) : undefined,
          };
        })
    : [];

  // Season bands are only rendered when segments are supplied (historical charts).
  // Forecast charts omit `seasons`, so they keep the original category axis.
  const referenceAreas = hasSeasons
    ? seasonSegments
        .map((segment) => ({
          type: segment.type,
          labelAr: segment.labelAr,
          x1: toTimestamp(segment.startDate),
          x2: toTimestamp(segment.endDate),
        }))
        .filter((area) => Number.isFinite(area.x1) && Number.isFinite(area.x2))
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
          <div className="rounded-[1.1rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-end">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-hint break-words">
              {t('chart.latest')}
            </p>
            <p className="mt-1 text-2xl font-black text-brand-ink break-words">
              {valueFormatter(latestPoint.value)}
            </p>
            <p className="mt-1 text-xs font-bold text-brand-ink-muted break-words">
              {dateFormatter(latestPoint.date)}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-brand-surface-border bg-brand-surface-light p-3">
          <TrendLineChart
            data={points}
            xKey={hasSeasons ? 'ts' : 'date'}
            yKey="value"
            variant="area"
            color={strokeColor}
            fillColor={fillColor}
            height={288}
            valueFormatter={valueFormatter}
            labelFormatter={dateFormatter}
            timeScale={hasSeasons}
            referenceAreas={referenceAreas}
          />
        </div>

        <div className="mt-4 grid min-w-0 gap-3 text-sm font-bold text-brand-ink-muted sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            {t('chart.pointsLoaded', { count: points.length })}
          </div>
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            {t('chart.high')} {valueFormatter(maxValue)}
          </div>
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-3">
            {t('chart.low')} {valueFormatter(minValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
