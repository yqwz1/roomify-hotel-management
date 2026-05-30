import { useState } from 'react';
import { Flame, Snowflake } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const heatColor = (score) => {
  const value = Number(score) || 0;
  if (value >= 85) return '#B93C2B';
  if (value >= 70) return '#E06C3A';
  if (value >= 55) return '#F0B44D';
  if (value >= 35) return '#6FB0C7';
  return '#315B7C';
};

const buildCalendarCells = (points) => {
  if (!points.length) return [];

  const firstDate = new Date(`${points[0].date}T00:00:00`);
  const leading = firstDate.getDay();
  const cells = Array.from({ length: leading }).map((_, index) => ({
    key: `empty-${index}`,
    empty: true,
  }));

  points.forEach((point) => {
    cells.push({
      key: point.date,
      point,
      empty: false,
    });
  });

  return cells;
};

export default function DemandHeatmapPanel({
  data,
  loading,
  error,
  onRetry,
  month,
  onMonthChange,
  roomTypeId,
  onRoomTypeChange,
  roomTypeOptions,
}) {
  const [selectedDate, setSelectedDate] = useState(null);

  if (loading) {
    return <div className="h-[28rem] animate-pulse rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light" />;
  }

  if (error && (!Array.isArray(data) || data.length === 0)) {
    return (
      <ErrorState
        title="Demand heatmap unavailable"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <EmptyState
        title="No demand heatmap data"
        message="There is no demand-intelligence data for the selected month and room-type filter."
        icon={Snowflake}
      />
    );
  }

  const activePoint = data.find((point) => point.date === selectedDate) || data[0];
  const cells = buildCalendarCells(data);

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-brand-ink">
            Month
            <input
              type="month"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
              className="rounded-2xl border border-brand-surface-border bg-white px-4 py-2.5 text-sm font-medium text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-brand-ink">
            Room Type
            <NativeSelect
              value={roomTypeId}
              onChange={(event) => onRoomTypeChange(event.target.value)}
              className="rounded-2xl border border-brand-surface-border bg-white px-4 py-2.5 text-sm font-medium text-brand-ink shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All room types</option>
              {roomTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink-muted">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#315B7C' }} />
            Low demand
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#B93C2B' }} />
            High demand
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)]">
        <div className="rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-sm">
          <div className="mb-4 grid min-w-0 grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted">
            {weekLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-7 gap-2">
            {cells.map((cell) =>
              cell.empty ? (
                <div key={cell.key} className="aspect-square rounded-2xl border border-dashed border-brand-surface-border/70 bg-brand-surface-light/40" />
              ) : (
                <Button variant="unstyled" size="none"
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDate(cell.point.date)}
                  title={`${cell.point.date} • score ${cell.point.demandScore} • occupancy ${cell.point.occupancy}% • revenue ${formatCurrency(cell.point.revenue)}`}
                  className={`aspect-square rounded-2xl border p-2 text-start shadow-sm transition hover:scale-[1.02] ${
                    activePoint.date === cell.point.date
                      ? 'border-brand-ink ring-2 ring-brand-ink/20'
                      : 'border-white/40'
                  }`}
                  style={{ backgroundColor: heatColor(cell.point.demandScore) }}
                >
                  <div className="flex min-w-0 h-full flex-col justify-between text-white">
                    <span className="text-sm font-black break-words">
                      {new Date(`${cell.point.date}T00:00:00`).getDate()}
                    </span>
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/75 break-words">
                      {cell.point.demandScore}
                    </span>
                  </div>
                </Button>
              )
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-sm">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                Day Analytics
              </p>
              <h4 className="mt-2 text-xl font-black tracking-tight text-brand-ink break-words">
                {activePoint.date}
              </h4>
            </div>
            <div
              className="rounded-full px-4 py-2 text-sm font-black text-white"
              style={{ backgroundColor: heatColor(activePoint.demandScore) }}
            >
              Score {activePoint.demandScore}
            </div>
          </div>

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                Occupancy
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-brand-ink break-words">
                {activePoint.occupancy}%
              </p>
            </div>
            <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                Revenue
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-brand-ink break-words">
                {formatCurrency(activePoint.revenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                Bookings
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-brand-ink break-words">
                {activePoint.bookings}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                Pattern
              </p>
              <div className="mt-3 flex min-w-0 items-center gap-2 text-lg font-black tracking-tight text-brand-ink">
                {activePoint.holiday ? <Flame className="h-5 w-5 text-brand-accent-terracotta shrink-0" /> : null}
                <span>
                  {activePoint.holiday
                    ? activePoint.holidayLabel
                    : activePoint.weekend
                      ? 'Weekend demand'
                      : 'Weekday demand'}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
