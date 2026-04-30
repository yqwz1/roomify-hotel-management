import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

const unavailable = 'Unavailable';

const RISK_CONFIG = {
  LOW: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800',
  HIGH: 'border-rose-200 bg-rose-50 text-rose-800',
  UNKNOWN: 'border-zinc-200 bg-zinc-50 text-zinc-700',
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(numeric)
    : unavailable;
};

const getAdjustmentValue = ({ adjustmentPercent, currentPrice, suggestedPrice }) => {
  const explicitAdjustment = Number(adjustmentPercent);
  if (Number.isFinite(explicitAdjustment)) return explicitAdjustment;

  const current = Number(currentPrice);
  const suggested = Number(suggestedPrice);
  if (!Number.isFinite(current) || !Number.isFinite(suggested) || current === 0) return null;

  return ((suggested - current) / current) * 100;
};

const formatAdjustment = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return unavailable;

  const prefix = numeric > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric)}%`;
};

const getAdjustmentStyle = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric === 0) {
    return {
      icon: Minus,
      className: 'border-zinc-200 bg-zinc-50 text-zinc-700',
      label: 'Hold',
    };
  }

  if (numeric > 0) {
    return {
      icon: TrendingUp,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      label: 'Increase',
    };
  }

  return {
    icon: TrendingDown,
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    label: 'Decrease',
  };
};

export default function PricingRecommendationCard({
  roomType = 'Deluxe Room',
  currentPrice = 480,
  suggestedPrice = 510,
  adjustmentPercent,
  reason = 'UI-ready placeholder for Day 7 Spring integration. This is not a live AI pricing decision.',
  riskLevel = 'UNKNOWN',
  source = 'UI placeholder',
}) {
  const normalizedRisk = String(riskLevel || 'UNKNOWN').toUpperCase();
  const adjustmentValue = getAdjustmentValue({
    adjustmentPercent,
    currentPrice,
    suggestedPrice,
  });
  const adjustmentStyle = getAdjustmentStyle(adjustmentValue);
  const AdjustmentIcon = adjustmentStyle.icon;

  return (
    <Card className="h-full rounded-[1.5rem] border border-zinc-200 bg-white p-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              Room Type
            </p>
            <CardTitle className="mt-2 break-words text-xl font-black tracking-tight text-zinc-950">
              {roomType || unavailable}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn('rounded-full px-3 py-1', RISK_CONFIG[normalizedRisk] ?? RISK_CONFIG.UNKNOWN)}
            >
              Risk: {normalizedRisk}
            </Badge>
            <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
              {source || 'Unknown source'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
              Current
            </p>
            <p className="mt-2 text-xl font-black text-zinc-950">{formatCurrency(currentPrice)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
              Suggested
            </p>
            <p className="mt-2 text-xl font-black text-zinc-950">{formatCurrency(suggestedPrice)}</p>
          </div>
          <div className={cn('rounded-2xl border p-4', adjustmentStyle.className)}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
              <AdjustmentIcon className="h-4 w-4" />
              {adjustmentStyle.label}
            </div>
            <p className="mt-2 text-xl font-black">{formatAdjustment(adjustmentValue)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            Reason
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">{reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
