import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  Bell,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Download,
  Gauge,
  Hotel,
  Layers3,
  LineChart,
  Receipt,
  RefreshCw,
  Search,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthProvider';
import { useManagerDashboard } from '../hooks/useManagerDashboard';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { cn } from '../lib/utils';
import {
  exportDashboardReport,
  extractDashboardError,
} from '../services/dashboardService';
import {
  getNotifications,
  extractNotificationError,
} from '../services/notificationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  getReservationStatusLabel,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';

const EXPORTABLE_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
];

const TREND_WIDTH = 720;
const TREND_HEIGHT = 260;
const TREND_PADDING = 28;

const METRIC_THEMES = {
  reservations: {
    card: 'border-sky-200 bg-sky-50/80',
    icon: 'bg-white text-sky-900 shadow-sm',
    badge: 'border-sky-200 bg-white/80 text-sky-900',
    value: 'text-sky-950',
    hint: 'text-sky-900/75',
  },
  active: {
    card: 'border-emerald-200 bg-emerald-50/80',
    icon: 'bg-white text-emerald-900 shadow-sm',
    badge: 'border-emerald-200 bg-white/80 text-emerald-900',
    value: 'text-emerald-950',
    hint: 'text-emerald-900/75',
  },
  revenue: {
    card: 'border-amber-200 bg-amber-50/85',
    icon: 'bg-white text-amber-900 shadow-sm',
    badge: 'border-amber-200 bg-white/80 text-amber-900',
    value: 'text-amber-950',
    hint: 'text-amber-900/75',
  },
  occupancy: {
    card: 'border-indigo-200 bg-indigo-50/85',
    icon: 'bg-white text-indigo-900 shadow-sm',
    badge: 'border-indigo-200 bg-white/80 text-indigo-900',
    value: 'text-indigo-950',
    hint: 'text-indigo-900/75',
  },
  stay: {
    card: 'border-rose-200 bg-rose-50/85',
    icon: 'bg-white text-rose-900 shadow-sm',
    badge: 'border-rose-200 bg-white/80 text-rose-900',
    value: 'text-rose-950',
    hint: 'text-rose-900/75',
  },
};

const SIGNAL_THEMES = {
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/80',
    icon: 'bg-emerald-100 text-emerald-900',
    eyebrow: 'text-emerald-700',
    title: 'text-emerald-950',
    body: 'text-emerald-900/80',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50/85',
    icon: 'bg-amber-100 text-amber-900',
    eyebrow: 'text-amber-700',
    title: 'text-amber-950',
    body: 'text-amber-900/80',
  },
  sky: {
    card: 'border-sky-200 bg-sky-50/85',
    icon: 'bg-sky-100 text-sky-900',
    eyebrow: 'text-sky-700',
    title: 'text-sky-950',
    body: 'text-sky-900/80',
  },
  rose: {
    card: 'border-rose-200 bg-rose-50/85',
    icon: 'bg-rose-100 text-rose-900',
    eyebrow: 'text-rose-700',
    title: 'text-rose-950',
    body: 'text-rose-900/80',
  },
};

const ROOM_TYPE_THEMES = [
  {
    accent: '#0f766e',
    card: 'border-emerald-200 bg-emerald-50/85',
    badge: 'border-emerald-200 bg-white/85 text-emerald-900',
    progress: 'bg-emerald-500',
    text: 'text-emerald-900',
  },
  {
    accent: '#0369a1',
    card: 'border-sky-200 bg-sky-50/85',
    badge: 'border-sky-200 bg-white/85 text-sky-900',
    progress: 'bg-sky-500',
    text: 'text-sky-900',
  },
  {
    accent: '#b45309',
    card: 'border-amber-200 bg-amber-50/85',
    badge: 'border-amber-200 bg-white/85 text-amber-900',
    progress: 'bg-amber-500',
    text: 'text-amber-900',
  },
  {
    accent: '#4338ca',
    card: 'border-indigo-200 bg-indigo-50/85',
    badge: 'border-indigo-200 bg-white/85 text-indigo-900',
    progress: 'bg-indigo-500',
    text: 'text-indigo-900',
  },
  {
    accent: '#be123c',
    card: 'border-rose-200 bg-rose-50/85',
    badge: 'border-rose-200 bg-white/85 text-rose-900',
    progress: 'bg-rose-500',
    text: 'text-rose-900',
  },
];

const toIsoDate = (value) => value.toISOString().split('T')[0];

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getDefaultRange = () => {
  const end = new Date();
  const start = addDays(end, -13);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

const buildRelativeRange = (days) => {
  const end = new Date();
  const start = addDays(end, -(days - 1));

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

const compareRanges = (left, right) =>
  left?.startDate === right?.startDate && left?.endDate === right?.endDate;

const formatPercent = (value) => `${Math.round(Number(value ?? 0) * 100)}%`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getDaysInRange = ({ startDate, endDate }) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const buildChartGeometry = (values) => {
  const maxValue = Math.max(...values, 0);
  const baselineY = TREND_HEIGHT - TREND_PADDING;
  const availableHeight = TREND_HEIGHT - TREND_PADDING * 2;
  const stepX =
    values.length > 1
      ? (TREND_WIDTH - TREND_PADDING * 2) / (values.length - 1)
      : 0;

  const coordinates = values.map((value, index) => {
    const normalized =
      maxValue > 0
        ? clamp(value / maxValue, value > 0 ? 0.08 : 0, 1)
        : 0;

    return {
      x: TREND_PADDING + stepX * index,
      y: baselineY - normalized * availableHeight,
    };
  });

  if (!coordinates.length) {
    return {
      areaPath: '',
      linePath: '',
      coordinates,
      maxValue,
    };
  }

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${baselineY} L ${coordinates[0].x} ${baselineY} Z`;

  return {
    areaPath,
    linePath,
    coordinates,
    maxValue,
  };
};

const buildNotificationTone = (notification) => {
  const text = `${notification?.title ?? ''} ${notification?.message ?? ''}`.toLowerCase();

  if (text.includes('fail') || text.includes('error') || text.includes('overdue')) {
    return {
      card: 'border-rose-200 bg-rose-50/80',
      badge: 'border-rose-200 bg-white text-rose-900',
      body: 'text-rose-900/80',
      eyebrow: 'text-rose-700',
    };
  }

  if (text.includes('payment') || text.includes('balance') || text.includes('invoice')) {
    return {
      card: 'border-amber-200 bg-amber-50/85',
      badge: 'border-amber-200 bg-white text-amber-900',
      body: 'text-amber-900/80',
      eyebrow: 'text-amber-700',
    };
  }

  return {
    card: 'border-sky-200 bg-sky-50/85',
    badge: 'border-sky-200 bg-white text-sky-900',
    body: 'text-sky-900/80',
    eyebrow: 'text-sky-700',
  };
};

function PerformanceMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  eyebrow,
  theme,
}) {
  const styles = METRIC_THEMES[theme] ?? METRIC_THEMES.reservations;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_20px_48px_-30px_rgba(15,23,42,0.24)]',
        styles.card
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl',
            styles.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        {eyebrow ? (
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]',
              styles.badge
            )}
          >
            {eyebrow}
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className={cn('mt-3 text-3xl font-black tracking-tight', styles.value)}>
        {value}
      </p>
      <p className={cn('mt-2 text-sm font-medium leading-6', styles.hint)}>{hint}</p>

      <div className="pointer-events-none absolute -bottom-10 -end-8 h-28 w-28 rounded-full border-[14px] border-white/50 opacity-60" />
    </div>
  );
}

function SignalCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = 'sky',
}) {
  const styles = SIGNAL_THEMES[tone] ?? SIGNAL_THEMES.sky;

  return (
    <div className={cn('rounded-[1.6rem] border p-5', styles.card)}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl',
            styles.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <p className={cn('text-xs font-black uppercase tracking-[0.2em]', styles.eyebrow)}>
            {eyebrow}
          </p>
          <p className={cn('mt-2 text-lg font-black tracking-tight', styles.title)}>
            {title}
          </p>
          <p className={cn('mt-2 text-sm font-medium leading-6', styles.body)}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function RangePresetButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-bold transition',
        active
          ? 'border-emerald-300 bg-emerald-500 text-white shadow-sm'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
      )}
    >
      {children}
    </button>
  );
}

function InteractiveTrendExplorer({
  pageTx,
  t,
  language,
  points,
  mode,
  onModeChange,
  selectedIndex,
  onSelectIndex,
}) {
  const modeConfig = useMemo(
    () => ({
      occupancy: {
        title: translateWithFallback(
          t,
          `${pageTx}.occupancyTrendTitle`,
          'Occupancy Trend'
        ),
        description: translateWithFallback(
          t,
          `${pageTx}.occupancyTrendDescription`,
          'Day-by-day occupancy returned by the live occupancy trend endpoint.'
        ),
        accent: '#0f766e',
        accentSoft: 'rgba(15,118,110,0.14)',
        accentSurface: 'border-emerald-200 bg-emerald-50/70',
        getValue: (point) => Number(point.occupancyRate ?? 0),
        formatValue: (value) => formatPercent(value),
        detailCards: (point) => [
          {
            label: translateWithFallback(t, `${pageTx}.trendOccupiedRooms`, 'Occupied rooms'),
            value: formatLocalizedNumber(point.occupiedRooms, language),
          },
          {
            label: translateWithFallback(t, `${pageTx}.trendTotalRooms`, 'Inventory'),
            value: formatLocalizedNumber(point.totalRooms, language),
          },
          {
            label: translateWithFallback(t, `${pageTx}.trendRevenueLabel`, 'Revenue'),
            value: formatLocalizedCurrency(point.revenue, language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          },
        ],
        summary: (point) =>
          translateWithFallback(
            t,
            `${pageTx}.occupancyPoint`,
            '{{occupied}} occupied of {{total}} rooms',
            {
              occupied: point.occupiedRooms,
              total: point.totalRooms,
            }
          ),
      },
      revenue: {
        title: translateWithFallback(
          t,
          `${pageTx}.revenueTrendTitle`,
          'Revenue Trend'
        ),
        description: translateWithFallback(
          t,
          `${pageTx}.revenueTrendDescription`,
          'Daily revenue and reservation count returned by the revenue trend endpoint.'
        ),
        accent: '#b45309',
        accentSoft: 'rgba(180,83,9,0.16)',
        accentSurface: 'border-amber-200 bg-amber-50/80',
        getValue: (point) => Number(point.revenue ?? 0),
        formatValue: (value) =>
          formatLocalizedCurrency(value, language, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
        detailCards: (point) => [
          {
            label: translateWithFallback(t, `${pageTx}.trendReservationsLabel`, 'Reservations'),
            value: formatLocalizedNumber(point.reservationCount, language),
          },
          {
            label: translateWithFallback(t, `${pageTx}.trendOccupancyLabel`, 'Occupancy'),
            value: formatPercent(point.occupancyRate),
          },
          {
            label: translateWithFallback(t, `${pageTx}.trendOccupiedRooms`, 'Occupied rooms'),
            value: formatLocalizedNumber(point.occupiedRooms, language),
          },
        ],
        summary: (point) =>
          translateWithFallback(
            t,
            `${pageTx}.revenuePoint`,
            '{{count}} reservation',
            { count: point.reservationCount }
          ),
      },
    }),
    [language, pageTx, t]
  );

  const activeMode = modeConfig[mode] ?? modeConfig.occupancy;
  const values = useMemo(
    () => points.map((point) => activeMode.getValue(point)),
    [activeMode, points]
  );
  const { areaPath, linePath, coordinates } = useMemo(
    () => buildChartGeometry(values),
    [values]
  );
  const selectedPoint = points[selectedIndex] ?? points[points.length - 1] ?? null;

  if (!points.length) {
    return (
      <EmptyState
        title={translateWithFallback(
          t,
          mode === 'occupancy'
            ? `${pageTx}.occupancyEmptyTitle`
            : `${pageTx}.revenueEmptyTitle`,
          mode === 'occupancy'
            ? 'No occupancy trend available'
            : 'No revenue trend available'
        )}
        message={translateWithFallback(
          t,
          mode === 'occupancy'
            ? `${pageTx}.occupancyEmptyDescription`
            : `${pageTx}.revenueEmptyDescription`,
          mode === 'occupancy'
            ? 'No occupancy data was returned for the current date range.'
            : 'No revenue data was returned for the current date range.'
        )}
        icon={LineChart}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]" data-testid="occupancy-trend">
      <div className="rounded-[1.6rem] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-lg font-black tracking-tight text-zinc-950">
              {activeMode.title}
            </p>
            <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
              {activeMode.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['occupancy', 'revenue'].map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                aria-pressed={mode === nextMode}
                onClick={() => onModeChange(nextMode)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-bold transition',
                  mode === nextMode
                    ? nextMode === 'occupancy'
                      ? 'border-emerald-300 bg-emerald-500 text-white'
                      : 'border-amber-300 bg-amber-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                )}
              >
                {nextMode === 'occupancy'
                  ? translateWithFallback(
                      t,
                      `${pageTx}.occupancyTrendTitle`,
                      'Occupancy Trend'
                    )
                  : translateWithFallback(
                      t,
                      `${pageTx}.revenueTrendTitle`,
                      'Revenue Trend'
                    )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
            className="h-[260px] min-w-[640px] w-full"
            role="img"
            aria-label={activeMode.title}
          >
            <defs>
              <linearGradient id="managerTrendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={activeMode.accent} stopOpacity="0.28" />
                <stop offset="100%" stopColor={activeMode.accent} stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((step) => {
              const y =
                TREND_HEIGHT - TREND_PADDING - step * (TREND_HEIGHT - TREND_PADDING * 2);
              return (
                <line
                  key={step}
                  x1={TREND_PADDING}
                  x2={TREND_WIDTH - TREND_PADDING}
                  y1={y}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeDasharray="6 8"
                />
              );
            })}

            <line
              x1={TREND_PADDING}
              x2={TREND_WIDTH - TREND_PADDING}
              y1={TREND_HEIGHT - TREND_PADDING}
              y2={TREND_HEIGHT - TREND_PADDING}
              stroke="#d4d4d8"
            />

            {areaPath ? (
              <path d={areaPath} fill="url(#managerTrendFill)" stroke="none" />
            ) : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke={activeMode.accent}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {coordinates.map((point, index) => {
              const active = index === selectedIndex;

              return (
                <g
                  key={`${points[index].key}-${index}`}
                  onClick={() => onSelectIndex(index)}
                  className="cursor-pointer"
                >
                  {active ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="14"
                      fill={activeMode.accentSoft}
                    />
                  ) : null}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={active ? '7' : '5'}
                    fill={active ? activeMode.accent : '#ffffff'}
                    stroke={activeMode.accent}
                    strokeWidth="3"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {points.map((point, index) => (
            <button
              key={point.key}
              type="button"
              onClick={() => onSelectIndex(index)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition',
                index === selectedIndex
                  ? activeMode.accentSurface
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
              )}
            >
              {point.label}
            </button>
          ))}
        </div>
      </div>

      {selectedPoint ? (
        <div className="space-y-3">
          <div
            className={cn(
              'rounded-[1.6rem] border p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)]',
              activeMode.accentSurface
            )}
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
              {translateWithFallback(t, `${pageTx}.selectedDateLabel`, 'Selected date')}
            </p>
            <p className="mt-2 text-sm font-bold text-zinc-700">{selectedPoint.fullLabel}</p>
            <p className="mt-4 text-3xl font-black tracking-tight text-zinc-950">
              {activeMode.formatValue(activeMode.getValue(selectedPoint))}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">
              {activeMode.summary(selectedPoint)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {activeMode.detailCards(selectedPoint).map((item) => (
              <div
                key={item.label}
                className="rounded-[1.35rem] border border-zinc-200 bg-white p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-black text-zinc-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoomTypeExplorer({
  pageTx,
  t,
  language,
  items,
  sortMode,
  onSortModeChange,
  selectedRoomTypeName,
  onSelectRoomType,
}) {
  if (!items.length) {
    return (
      <EmptyState
        title={translateWithFallback(
          t,
          `${pageTx}.distributionEmptyTitle`,
          'No room-type distribution available'
        )}
        message={translateWithFallback(
          t,
          `${pageTx}.distributionEmptyDescription`,
          'The backend returned no room-type distribution data.'
        )}
        icon={Hotel}
      />
    );
  }

  const sortLabels = {
    occupancy: translateWithFallback(
      t,
      `${pageTx}.distributionSortOccupancy`,
      'Sort by occupancy'
    ),
    inventory: translateWithFallback(
      t,
      `${pageTx}.distributionSortInventory`,
      'Sort by inventory'
    ),
    rate: translateWithFallback(
      t,
      `${pageTx}.distributionSortRate`,
      'Sort by rate'
    ),
  };

  const selectedItem =
    items.find((item) => item.roomTypeName === selectedRoomTypeName) ?? items[0];
  const selectedIndex = items.findIndex(
    (item) => item.roomTypeName === selectedItem.roomTypeName
  );
  const selectedTheme =
    ROOM_TYPE_THEMES[selectedIndex % ROOM_TYPE_THEMES.length] ?? ROOM_TYPE_THEMES[0];
  const occupiedPercent = Math.round(Number(selectedItem.occupancyRate ?? 0) * 100);
  const vacantRooms = Math.max(
    Number(selectedItem.totalRooms ?? 0) - Number(selectedItem.occupiedRooms ?? 0),
    0
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(sortLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSortModeChange(key)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-bold transition',
                sortMode === key
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const active = item.roomTypeName === selectedItem.roomTypeName;
            const theme = ROOM_TYPE_THEMES[index % ROOM_TYPE_THEMES.length];

            return (
              <button
                key={item.roomTypeName}
                type="button"
                onClick={() => onSelectRoomType(item.roomTypeName)}
                className={cn(
                  'w-full rounded-[1.45rem] border p-4 text-left transition',
                  active
                    ? theme.card
                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-950">
                      {translateKnownValue(item.roomTypeName, t)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {translateWithFallback(
                        t,
                        `${pageTx}.distributionRate`,
                        'Base rate {{rate}}',
                        {
                          rate: formatLocalizedCurrency(item.basePrice, language, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }),
                        }
                      )}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]',
                      active ? theme.badge : 'border-zinc-200 bg-white text-zinc-700'
                    )}
                  >
                    {formatPercent(item.occupancyRate)}
                  </span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white/80">
                  <div
                    className={cn('h-2 rounded-full', theme.progress)}
                    style={{
                      width: `${Math.max(Number(item.occupancyRate ?? 0) * 100, item.occupiedRooms ? 8 : 0)}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm font-medium text-zinc-600">
                  <span>
                    {translateWithFallback(
                      t,
                      `${pageTx}.distributionOccupiedRooms`,
                      'Occupied rooms'
                    )}
                    : {formatLocalizedNumber(item.occupiedRooms, language)}
                  </span>
                  <span>
                    {translateWithFallback(
                      t,
                      `${pageTx}.distributionTotalRooms`,
                      'Total rooms'
                    )}
                    : {formatLocalizedNumber(item.totalRooms, language)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn('rounded-[1.75rem] border p-6', selectedTheme.card)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">
              {translateWithFallback(
                t,
                `${pageTx}.distributionSelectedLabel`,
                'Selected room type'
              )}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
              {translateKnownValue(selectedItem.roomTypeName, t)}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-700">
              {translateWithFallback(
                t,
                `${pageTx}.distributionInsight`,
                'Use this view to compare live occupancy, room inventory, and current pricing before making availability decisions.'
              )}
            </p>
          </div>

          <span
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em]',
              selectedTheme.badge
            )}
          >
            {formatPercent(selectedItem.occupancyRate)}
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="mx-auto flex items-center justify-center">
            <div
              className="flex h-52 w-52 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${selectedTheme.accent} ${occupiedPercent}%, rgba(255,255,255,0.75) ${occupiedPercent}% 100%)`,
              }}
            >
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  {translateWithFallback(
                    t,
                    `${pageTx}.distributionOccupancyCore`,
                    'Occupancy'
                  )}
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
                  {occupiedPercent}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-white bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {translateWithFallback(
                  t,
                  `${pageTx}.distributionTotalRooms`,
                  'Total rooms'
                )}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950">
                {formatLocalizedNumber(selectedItem.totalRooms, language)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {translateWithFallback(
                  t,
                  `${pageTx}.distributionOccupiedRooms`,
                  'Occupied rooms'
                )}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950">
                {formatLocalizedNumber(selectedItem.occupiedRooms, language)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {translateWithFallback(t, `${pageTx}.distributionVacantRooms`, 'Vacant rooms')}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950">
                {formatLocalizedNumber(vacantRooms, language)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {translateWithFallback(t, `${pageTx}.distributionRateLabel`, 'Base rate')}
              </p>
              <p className="mt-2 text-2xl font-black text-zinc-950">
                {formatLocalizedCurrency(selectedItem.basePrice, language, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const pageTx = 'managerDashboardPage';
  const welcomeName = user?.username || t('managerFallback') || t('roleManager');

  const [draftRange, setDraftRange] = useState(getDefaultRange);
  const [appliedRange, setAppliedRange] = useState(getDefaultRange);
  const [filterError, setFilterError] = useState(null);
  const [chartMode, setChartMode] = useState('occupancy');
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(0);
  const [distributionSort, setDistributionSort] = useState('occupancy');
  const [selectedRoomTypeName, setSelectedRoomTypeName] = useState('');
  const [notificationScope, setNotificationScope] = useState('all');
  const [exportFilters, setExportFilters] = useState({
    roomTypeId: '',
    status: '',
  });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(null);

  const {
    metrics,
    occupancyTrend,
    revenueTrend,
    roomTypeDistribution,
    loading,
    error,
    reload,
  } = useManagerDashboard(appliedRange);
  const { roomTypes, fetchRoomTypes } = useRoomTypes();

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const loadActivity = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    const [notificationsResult] = await Promise.allSettled([getNotifications()]);

    if (notificationsResult.status === 'fulfilled') {
      setNotifications(notificationsResult.value);
    } else {
      setNotifications([]);
      setNotificationsError(extractNotificationError(notificationsResult.reason));
    }

    setNotificationsLoading(false);
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!exportUrl) return undefined;

    return () => {
      URL.revokeObjectURL(exportUrl);
    };
  }, [exportUrl]);

  const rangePresets = useMemo(
    () => [
      {
        id: '7d',
        label: translateWithFallback(t, `${pageTx}.presetLast7`, 'Last 7 days'),
        range: buildRelativeRange(7),
      },
      {
        id: '14d',
        label: translateWithFallback(t, `${pageTx}.presetLast14`, 'Last 14 days'),
        range: buildRelativeRange(14),
      },
      {
        id: '30d',
        label: translateWithFallback(t, `${pageTx}.presetLast30`, 'Last 30 days'),
        range: buildRelativeRange(30),
      },
      {
        id: '90d',
        label: translateWithFallback(t, `${pageTx}.presetLast90`, 'Last 90 days'),
        range: buildRelativeRange(90),
      },
    ],
    [pageTx, t]
  );

  const activePresetId =
    rangePresets.find((preset) => compareRanges(draftRange, preset.range))?.id ?? null;
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        title: t(`${pageTx}.quickActionItems.newBookingTitle`),
        description: t(`${pageTx}.quickActionItems.newBookingDescription`),
        onClick: () => navigate('/search'),
      },
      {
        icon: ClipboardCheck,
        title: t(`${pageTx}.quickActionItems.checkInTitle`),
        description: t(`${pageTx}.quickActionItems.checkInDescription`),
        onClick: () => navigate('/check-in'),
      },
      {
        icon: CalendarRange,
        title: t('navReservations'),
        description: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.reservationsDescription`,
          'Open the live reservations workspace for queue-driven operations.'
        ),
        onClick: () => navigate('/reservations'),
      },
      {
        icon: Receipt,
        title: t(`${pageTx}.quickActionItems.invoicesTitle`),
        description: t(`${pageTx}.quickActionItems.invoicesDescription`),
        onClick: () => navigate('/invoice-preview'),
      },
      {
        icon: WalletCards,
        title: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.expensesTitle`,
          'Expense Tracker'
        ),
        description: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.expensesDescription`,
          'Track operating spend, compare it against revenue, and update expense records quickly.'
        ),
        onClick: () => navigate('/manager/expenses'),
      },
      {
        icon: TrendingUp,
        title: t('roomStatus'),
        description: translateWithFallback(
          t,
          `${pageTx}.quickActionItems.roomStatusDescription`,
          'Review room readiness, cleaning, and operational status transitions.'
        ),
        onClick: () => navigate('/room-status'),
      },
      {
        icon: BedDouble,
        title: t(`${pageTx}.quickActionItems.roomsTitle`),
        description: t(`${pageTx}.quickActionItems.roomsDescription`),
        onClick: () => navigate('/rooms-management'),
      },
    ],
    [navigate, pageTx, t]
  );

  const metricCards = useMemo(() => {
    if (!metrics) return [];

    const totalReservations = Number(metrics.totalReservations ?? 0);
    const activeReservations = Number(metrics.activeReservations ?? 0);
    return [
      {
        icon: CalendarRange,
        label: t(`${pageTx}.metrics.totalReservationsLabel`),
        value: formatLocalizedNumber(totalReservations, i18n.language),
        hint: t(`${pageTx}.metrics.totalReservationsHint`),
        eyebrow: translateWithFallback(t, `${pageTx}.metricReservationsEyebrow`, 'Demand'),
        theme: 'reservations',
      },
      {
        icon: ClipboardCheck,
        label: t(`${pageTx}.metrics.activeReservationsLabel`),
        value: formatLocalizedNumber(activeReservations, i18n.language),
        hint: t(`${pageTx}.metrics.activeReservationsHint`),
        eyebrow: translateWithFallback(t, `${pageTx}.metricActiveEyebrow`, 'Live stays'),
        theme: 'active',
      },
      {
        icon: Receipt,
        label: t(`${pageTx}.metrics.revenueLabel`),
        value: formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        hint: t(`${pageTx}.metrics.revenueHint`),
        eyebrow: translateWithFallback(t, `${pageTx}.metricRevenueEyebrow`, 'Finance'),
        theme: 'revenue',
      },
      {
        icon: WalletCards,
        label: translateWithFallback(t, `${pageTx}.metrics.expensesLabel`, 'Expenses'),
        value: formatLocalizedCurrency(metrics.totalExpenses, i18n.language, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        hint: translateWithFallback(
          t,
          `${pageTx}.metrics.expensesHint`,
          'Operating expenses tracked in the active range.'
        ),
        eyebrow: translateWithFallback(t, `${pageTx}.metricExpensesEyebrow`, 'Spend'),
        theme: 'stay',
      },
      {
        icon: TrendingUp,
        label: translateWithFallback(t, `${pageTx}.metrics.netProfitLabel`, 'Net Profit'),
        value: formatLocalizedCurrency(metrics.netProfit, i18n.language, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        hint: translateWithFallback(
          t,
          `${pageTx}.metrics.netProfitHint`,
          'Revenue minus operating expenses for the selected range.'
        ),
        eyebrow: translateWithFallback(t, `${pageTx}.metricNetProfitEyebrow`, 'Result'),
        theme: Number(metrics.netProfit ?? 0) >= 0 ? 'active' : 'stay',
      },
      {
        icon: Gauge,
        label: t(`${pageTx}.metrics.occupancyLabel`),
        value: formatPercent(metrics.occupancyRate),
        hint: t(`${pageTx}.metrics.occupancyHint`),
        eyebrow: translateWithFallback(t, `${pageTx}.metricOccupancyEyebrow`, 'Capacity'),
        theme: 'occupancy',
      },
    ];
  }, [i18n.language, metrics, pageTx, t]);

  const combinedTrendPoints = useMemo(() => {
    const byDate = new Map();

    occupancyTrend.forEach((point) => {
      const current = byDate.get(point.date) ?? { date: point.date };
      byDate.set(point.date, {
        ...current,
        occupancyRate: Number(point.occupancyRate ?? 0),
        occupiedRooms: Number(point.occupiedRooms ?? 0),
        totalRooms: Number(point.totalRooms ?? 0),
      });
    });

    revenueTrend.forEach((point) => {
      const current = byDate.get(point.date) ?? { date: point.date };
      byDate.set(point.date, {
        ...current,
        revenue: Number(point.revenue ?? 0),
        reservationCount: Number(point.reservationCount ?? 0),
      });
    });

    return Array.from(byDate.values())
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))
      .map((point) => ({
        key: String(point.date),
        date: point.date,
        label: formatLocalizedDate(point.date, i18n.language, {
          month: 'short',
          day: 'numeric',
        }),
        fullLabel: formatLocalizedDate(point.date, i18n.language, {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        occupancyRate: Number(point.occupancyRate ?? 0),
        occupiedRooms: Number(point.occupiedRooms ?? 0),
        totalRooms: Number(point.totalRooms ?? 0),
        revenue: Number(point.revenue ?? 0),
        reservationCount: Number(point.reservationCount ?? 0),
      }));
  }, [i18n.language, occupancyTrend, revenueTrend]);

  useEffect(() => {
    if (!combinedTrendPoints.length) {
      setSelectedTrendIndex(0);
      return;
    }

    setSelectedTrendIndex((current) =>
      current >= 0 && current < combinedTrendPoints.length
        ? current
        : combinedTrendPoints.length - 1
    );
  }, [combinedTrendPoints.length]);

  const distributionItems = useMemo(() => {
    const items = [...roomTypeDistribution];

    items.sort((left, right) => {
      switch (distributionSort) {
        case 'inventory':
          return Number(right.totalRooms ?? 0) - Number(left.totalRooms ?? 0);
        case 'rate':
          return Number(right.basePrice ?? 0) - Number(left.basePrice ?? 0);
        case 'occupancy':
        default:
          return Number(right.occupancyRate ?? 0) - Number(left.occupancyRate ?? 0);
      }
    });

    return items;
  }, [distributionSort, roomTypeDistribution]);

  useEffect(() => {
    if (!distributionItems.length) {
      setSelectedRoomTypeName('');
      return;
    }

    setSelectedRoomTypeName((current) =>
      distributionItems.some((item) => item.roomTypeName === current)
        ? current
        : distributionItems[0].roomTypeName
    );
  }, [distributionItems]);

  const revenuePerReservation = useMemo(() => {
    if (!metrics) return 0;

    const totalReservations = Number(metrics.totalReservations ?? 0);
    if (totalReservations <= 0) return 0;

    return Number(metrics.totalRevenue ?? 0) / totalReservations;
  }, [metrics]);

  const revenueDelta = useMemo(() => {
    if (combinedTrendPoints.length < 2) return 0;

    const latest = combinedTrendPoints[combinedTrendPoints.length - 1];
    const previous = combinedTrendPoints[combinedTrendPoints.length - 2];
    return Number(latest.revenue ?? 0) - Number(previous.revenue ?? 0);
  }, [combinedTrendPoints]);

  const heroSignal = useMemo(() => {
    if (!metrics) {
      return translateWithFallback(
        t,
        `${pageTx}.heroSignalLoading`,
        'Live performance insights will appear as soon as the dashboard data is ready.'
      );
    }

    const occupancyRate = Number(metrics.occupancyRate ?? 0);
    if (occupancyRate >= 0.8) {
      return translateWithFallback(
        t,
        `${pageTx}.heroSignalHighDemand`,
        'Demand is strong. Keep room turnover tight so available inventory is not lost.'
      );
    }

    if (occupancyRate >= 0.6) {
      return translateWithFallback(
        t,
        `${pageTx}.heroSignalBalanced`,
        'Occupancy is healthy. Use the charts below to spot revenue and room-type opportunities.'
      );
    }

    return translateWithFallback(
      t,
      `${pageTx}.heroSignalSoftDemand`,
      'Occupancy is softer than expected. Focus on pricing, availability mix, and unresolved alerts.'
    );
  }, [metrics, pageTx, t]);

  const managerSignals = useMemo(() => {
    if (!metrics) return [];

    const occupancyRate = Number(metrics.occupancyRate ?? 0);
    const occupancySignal =
      occupancyRate >= 0.8
        ? {
            icon: Gauge,
            eyebrow: translateWithFallback(
              t,
              `${pageTx}.signalOccupancyEyebrow`,
              'Occupancy signal'
            ),
            title: translateWithFallback(
              t,
              `${pageTx}.signalOccupancyHighTitle`,
              'High-demand window'
            ),
            description: translateWithFallback(
              t,
              `${pageTx}.signalOccupancyHighDescription`,
              'The property is running hot. Prioritize room turnover and stay extensions carefully.'
            ),
            tone: 'emerald',
          }
        : occupancyRate >= 0.6
          ? {
              icon: Gauge,
              eyebrow: translateWithFallback(
                t,
                `${pageTx}.signalOccupancyEyebrow`,
                'Occupancy signal'
              ),
              title: translateWithFallback(
                t,
                `${pageTx}.signalOccupancyBalancedTitle`,
                'Balanced occupancy'
              ),
              description: translateWithFallback(
                t,
                `${pageTx}.signalOccupancyBalancedDescription`,
                'The property is in a stable operating band. Watch the room-type mix and unread alerts.'
              ),
              tone: 'sky',
            }
          : {
              icon: Gauge,
              eyebrow: translateWithFallback(
                t,
                `${pageTx}.signalOccupancyEyebrow`,
                'Occupancy signal'
              ),
              title: translateWithFallback(
                t,
                `${pageTx}.signalOccupancySoftTitle`,
                'Soft demand'
              ),
              description: translateWithFallback(
                t,
                `${pageTx}.signalOccupancySoftDescription`,
                'Demand is below the healthy band. Review room-type performance and any friction in the booking flow.'
              ),
              tone: 'amber',
            };

    const revenueSignal = revenueDelta >= 0
      ? {
          icon: ArrowUpRight,
          eyebrow: translateWithFallback(
            t,
            `${pageTx}.signalRevenueEyebrow`,
            'Revenue signal'
          ),
          title: translateWithFallback(
            t,
            `${pageTx}.signalRevenueUpTitle`,
            'Revenue moving up'
          ),
          description: translateWithFallback(
            t,
            `${pageTx}.signalRevenueUpDescription`,
            'Latest daily revenue is trending above the previous point. Use the chart to confirm if the move is broad or room-type specific.'
          ),
          tone: 'emerald',
        }
      : {
          icon: ArrowDownRight,
          eyebrow: translateWithFallback(
            t,
            `${pageTx}.signalRevenueEyebrow`,
            'Revenue signal'
          ),
          title: translateWithFallback(
            t,
            `${pageTx}.signalRevenueDownTitle`,
            'Revenue cooling off'
          ),
          description: translateWithFallback(
            t,
            `${pageTx}.signalRevenueDownDescription`,
            'Latest daily revenue is below the previous point. Check if occupancy or reservation count is driving the drop.'
          ),
          tone: 'amber',
        };

    const attentionSignal = notificationsLoading
      ? {
          icon: Bell,
          eyebrow: translateWithFallback(
            t,
            `${pageTx}.signalAttentionEyebrow`,
            'Attention'
          ),
          title: translateWithFallback(
            t,
            `${pageTx}.signalAttentionLoadingTitle`,
            'Loading manager alerts'
          ),
          description: translateWithFallback(
            t,
            `${pageTx}.signalAttentionLoadingDescription`,
            'Recent notifications are still loading into the dashboard.'
          ),
          tone: 'sky',
        }
      : unreadNotifications > 0
        ? {
            icon: CircleAlert,
            eyebrow: translateWithFallback(
              t,
              `${pageTx}.signalAttentionEyebrow`,
              'Attention'
            ),
            title: translateWithFallback(
              t,
              `${pageTx}.signalAttentionUnreadTitle`,
              '{{count}} unread alert',
              { count: unreadNotifications }
            ),
            description: translateWithFallback(
              t,
              `${pageTx}.signalAttentionUnreadDescription`,
              'Manager-facing alerts still need review. Use the activity feed to triage them quickly.'
            ),
            tone: 'rose',
          }
        : {
            icon: CheckCircle2,
            eyebrow: translateWithFallback(
              t,
              `${pageTx}.signalAttentionEyebrow`,
              'Attention'
            ),
            title: translateWithFallback(
              t,
              `${pageTx}.signalAttentionClearTitle`,
              'No unread alerts'
            ),
            description: translateWithFallback(
              t,
              `${pageTx}.signalAttentionClearDescription`,
              'There are no unread manager alerts right now, so you can focus on performance and planning.'
            ),
            tone: 'emerald',
          };

    return [occupancySignal, revenueSignal, attentionSignal];
  }, [metrics, notificationsLoading, pageTx, revenueDelta, t, unreadNotifications]);

  const visibleNotifications = useMemo(() => {
    if (notificationScope === 'unread') {
      return notifications.filter((notification) => !notification.read);
    }

    return notifications;
  }, [notificationScope, notifications]);

  const handleRangeChange = (field, value) => {
    setDraftRange((current) => ({ ...current, [field]: value }));
  };

  const handleApplyRange = () => {
    if (!draftRange.startDate || !draftRange.endDate) {
      setFilterError(t(`${pageTx}.filtersRequired`));
      return;
    }

    if (draftRange.endDate < draftRange.startDate) {
      setFilterError(t(`${pageTx}.filtersInvalid`));
      return;
    }

    setFilterError(null);
    setAppliedRange(draftRange);
  };

  const handlePresetSelect = (range) => {
    setFilterError(null);
    setDraftRange(range);
    setAppliedRange(range);
  };

  const handleResetRange = () => {
    const nextRange = getDefaultRange();
    setFilterError(null);
    setDraftRange(nextRange);
    setAppliedRange(nextRange);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    try {
      const payload = {
        startDate: appliedRange.startDate,
        endDate: appliedRange.endDate,
        exportFormat: 'JSON',
      };

      if (exportFilters.roomTypeId) {
        payload.roomTypeId = Number(exportFilters.roomTypeId);
      }

      if (exportFilters.status) {
        payload.status = exportFilters.status;
      }

      const result = await exportDashboardReport(payload);
      const nextBlob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      });
      const nextUrl = URL.createObjectURL(nextBlob);

      setExportUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextUrl;
      });
      setExportResult(result);
    } catch (err) {
      setExportError(extractDashboardError(err));
      setExportResult(null);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message={t(`${pageTx}.loading`)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState title={t(`${pageTx}.errorTitle`)} message={error} onRetry={reload} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          title={t(`${pageTx}.emptyTitle`)}
          message={t(`${pageTx}.emptyDescription`)}
          icon={LineChart}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('managerDashboardTitle')}
        description={t(`${pageTx}.description`, { name: welcomeName })}
        className="border-emerald-400/10 bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_52%,#072f2a_100%)]"
        meta={[
          t(`${pageTx}.metaRange`, {
            start: formatLocalizedDate(appliedRange.startDate, i18n.language, {
              month: 'short',
              day: 'numeric',
            }),
            end: formatLocalizedDate(appliedRange.endDate, i18n.language, {
              month: 'short',
              day: 'numeric',
            }),
          }),
          t(`${pageTx}.metaOccupancy`, { value: formatPercent(metrics.occupancyRate) }),
          t(`${pageTx}.metaRevenue`, {
            value: formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          }),
          translateWithFallback(t, `${pageTx}.metaExpenses`, 'Expenses {{value}}', {
            value: formatLocalizedCurrency(metrics.totalExpenses, i18n.language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          }),
          translateWithFallback(t, `${pageTx}.metaNetProfit`, 'Net {{value}}', {
            value: formatLocalizedCurrency(metrics.netProfit, i18n.language, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(t, `${pageTx}.heroSnapshotTitle`, 'Live Snapshot')}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, `${pageTx}.heroActiveReservations`, 'Active reservations')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedNumber(metrics.activeReservations, i18n.language)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, `${pageTx}.heroRevenuePerReservation`, 'Revenue per reservation')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedCurrency(revenuePerReservation, i18n.language, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, `${pageTx}.heroNetProfit`, 'Net profit')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedCurrency(metrics.netProfit, i18n.language, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, `${pageTx}.heroDaysInView`, 'Days in view')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedNumber(getDaysInRange(appliedRange), i18n.language)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
              {translateWithFallback(t, `${pageTx}.heroSignalLabel`, 'Manager signal')}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-white/85">{heroSignal}</p>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title={translateWithFallback(t, `${pageTx}.filterDeckTitle`, 'View Filters')}
          description={translateWithFallback(
            t,
            `${pageTx}.filterDeckDescription`,
            'Adjust the live date range with presets or manual inputs, then refresh the dashboard without losing context.'
          )}
          action={
            <Button type="button" variant="outline" onClick={reload} className="border-zinc-200">
              <RefreshCw className="h-4 w-4" />
              {t('retry')}
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {rangePresets.map((preset) => (
                <RangePresetButton
                  key={preset.id}
                  active={activePresetId === preset.id}
                  onClick={() => handlePresetSelect(preset.range)}
                >
                  {preset.label}
                </RangePresetButton>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.startDateLabel`)}
                </span>
                <input
                  type="date"
                  value={draftRange.startDate}
                  onChange={(event) => handleRangeChange('startDate', event.target.value)}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.endDateLabel`)}
                </span>
                <input
                  type="date"
                  value={draftRange.endDate}
                  onChange={(event) => handleRangeChange('endDate', event.target.value)}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </label>
            </div>

            {filterError ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {filterError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleApplyRange}
                className="h-12 bg-zinc-950 text-white hover:bg-zinc-800"
              >
                {t(`${pageTx}.applyFilters`)}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetRange}
                className="h-12 border-zinc-200"
              >
                {t(`${pageTx}.resetFilters`)}
              </Button>
            </div>

            <div className="rounded-[1.45rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {t(`${pageTx}.controlsSummaryTitle`)}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {t(`${pageTx}.controlsSummaryReservations`)}
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">
                    {formatLocalizedNumber(metrics.totalReservations, i18n.language)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {t(`${pageTx}.controlsSummaryRevenue`)}
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">
                    {formatLocalizedCurrency(metrics.totalRevenue, i18n.language, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {translateWithFallback(t, `${pageTx}.controlsSummaryExpenses`, 'Expenses')}
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">
                    {formatLocalizedCurrency(metrics.totalExpenses, i18n.language, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {translateWithFallback(t, `${pageTx}.controlsSummaryNetProfit`, 'Net Profit')}
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">
                    {formatLocalizedCurrency(metrics.netProfit, i18n.language, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.exportTitle`)}
          description={t(`${pageTx}.exportDescription`)}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.exportRoomTypeLabel`)}
                </span>
                <select
                  value={exportFilters.roomTypeId}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      roomTypeId: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">{t(`${pageTx}.allRoomTypes`)}</option>
                  {roomTypes.map((roomType) => (
                    <option key={roomType.id} value={roomType.id}>
                      {translateKnownValue(roomType.name, t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t(`${pageTx}.exportStatusLabel`)}
                </span>
                <select
                  value={exportFilters.status}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">{t(`${pageTx}.allStatuses`)}</option>
                  {EXPORTABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getReservationStatusLabel(status, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium leading-6 text-amber-900">
              {t(`${pageTx}.exportNote`)}
            </div>

            {exportError ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {exportError}
              </div>
            ) : null}

            {exportResult ? (
              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {t(`${pageTx}.exportGeneratedAt`)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-950">
                      {formatLocalizedDateTime(exportResult.generatedAt, i18n.language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {t(`${pageTx}.exportRecords`)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-950">
                      {formatLocalizedNumber(exportResult.totalRecords, i18n.language)}
                    </p>
                  </div>
                </div>

                {exportUrl ? (
                  <div className="mt-4">
                    <Button
                      asChild
                      className="bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      <a
                        href={exportUrl}
                        download={`roomify-report-${appliedRange.startDate}-${appliedRange.endDate}.json`}
                      >
                        <Download className="h-4 w-4" />
                        {t(`${pageTx}.downloadExport`)}
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="h-12 bg-zinc-950 text-white hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              {exporting ? t(`${pageTx}.exporting`) : t(`${pageTx}.exportAction`)}
            </Button>
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <PerformanceMetricCard key={card.label} {...card} />
        ))}
      </div>

      <DashboardPanel
        title={translateWithFallback(t, `${pageTx}.signalsTitle`, 'Manager Signals')}
        description={translateWithFallback(
          t,
          `${pageTx}.signalsDescription`,
          'Read the dashboard as a story: what demand is doing, what revenue is doing, and what still needs attention.'
        )}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {managerSignals.map((signal) => (
            <SignalCard key={signal.title} {...signal} />
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title={translateWithFallback(t, `${pageTx}.trendExplorerTitle`, 'Trend Explorer')}
        description={translateWithFallback(
          t,
          `${pageTx}.trendExplorerDescription`,
          'Switch between occupancy and revenue, then inspect a single day without leaving the dashboard.'
        )}
      >
        <InteractiveTrendExplorer
          pageTx={pageTx}
          t={t}
          language={i18n.language}
          points={combinedTrendPoints}
          mode={chartMode}
          onModeChange={setChartMode}
          selectedIndex={selectedTrendIndex}
          onSelectIndex={setSelectedTrendIndex}
        />
      </DashboardPanel>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <DashboardPanel
          title={t(`${pageTx}.distributionTitle`)}
          description={translateWithFallback(
            t,
            `${pageTx}.distributionDescription`,
            'Compare live room-type occupancy, inventory, and price so the strongest and weakest segments are obvious.'
          )}
        >
          <RoomTypeExplorer
            pageTx={pageTx}
            t={t}
            language={i18n.language}
            items={distributionItems}
            sortMode={distributionSort}
            onSortModeChange={setDistributionSort}
            selectedRoomTypeName={selectedRoomTypeName}
            onSelectRoomType={setSelectedRoomTypeName}
          />
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.quickActionsTitle`)}
          description={t(`${pageTx}.quickActionsDescription`)}
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <LineChart className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-950">AI Finance Dashboard</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-zinc-500">
                      View revenue forecasts and pricing recommendations.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate('/manager/ai-finance')}
                  className="h-10 flex-shrink-0 bg-zinc-950 px-4 text-white hover:bg-zinc-800"
                >
                  <LineChart className="h-4 w-4" />
                  Open AI Finance
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {quickActions.map((action) => (
                <DashboardQuickAction key={action.title} {...action} />
              ))}
            </div>

            <div className="rounded-[1.45rem] border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                  <Layers3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-zinc-950">
                    {translateWithFallback(
                      t,
                      `${pageTx}.workflowHintTitle`,
                      'Recommended manager workflow'
                    )}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-zinc-600">
                    {translateWithFallback(
                      t,
                      `${pageTx}.workflowHintDescription`,
                      'Start with the trend explorer to spot a shift, confirm the room-type mix beside it, then jump into reservations or room status to act.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title={t(`${pageTx}.notificationsTitle`)}
        description={t(`${pageTx}.notificationsDescription`)}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={loadActivity}
            className="border-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            {t('retry')}
          </Button>
        }
      >
        {notificationsLoading ? (
          <LoadingState message={t(`${pageTx}.notificationsLoading`)} />
        ) : notificationsError ? (
          <ErrorState
            title={t(`${pageTx}.notificationsTitle`)}
            message={notificationsError}
            onRetry={loadActivity}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title={t(`${pageTx}.notificationsEmptyTitle`)}
            message={t(`${pageTx}.notificationsEmptyDescription`)}
            icon={Bell}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setNotificationScope('all')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-bold transition',
                  notificationScope === 'all'
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                )}
              >
                {translateWithFallback(t, `${pageTx}.notificationsAll`, 'All alerts')}
              </button>
              <button
                type="button"
                onClick={() => setNotificationScope('unread')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-bold transition',
                  notificationScope === 'unread'
                    ? 'border-rose-300 bg-rose-500 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                )}
              >
                {translateWithFallback(
                  t,
                  `${pageTx}.notificationsUnread`,
                  'Unread alerts'
                )}
              </button>
            </div>

            {visibleNotifications.length === 0 ? (
              <EmptyState
                title={translateWithFallback(
                  t,
                  `${pageTx}.notificationsFilteredEmptyTitle`,
                  'No alerts in this filter'
                )}
                message={translateWithFallback(
                  t,
                  `${pageTx}.notificationsFilteredEmptyDescription`,
                  'All manager alerts are already marked as read.'
                )}
                icon={Bell}
              />
            ) : (
              <div className="grid gap-3 xl:grid-cols-2" data-testid="manager-notifications">
                {visibleNotifications.slice(0, 6).map((notification) => {
                  const tone = buildNotificationTone(notification);

                  return (
                    <div
                      key={notification.id}
                      className={cn('rounded-[1.45rem] border p-4', tone.card)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn('text-xs font-black uppercase tracking-[0.2em]', tone.eyebrow)}>
                            {formatLocalizedDateTime(notification.createdAt, i18n.language, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <p className="mt-2 text-lg font-black text-zinc-950">
                            {notification.title}
                          </p>
                          <p className={cn('mt-2 text-sm font-medium leading-6', tone.body)}>
                            {notification.message}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]',
                            notification.read
                              ? 'border-zinc-200 bg-white text-zinc-500'
                              : tone.badge
                          )}
                        >
                          {notification.read
                            ? t(`${pageTx}.readLabel`)
                            : t(`${pageTx}.newLabel`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
