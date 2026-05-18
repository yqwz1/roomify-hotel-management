import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

const unavailable = 'Unavailable';

const RISK_CONFIG = {
  LOW: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  MEDIUM: 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning',
  HIGH: 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger',
  UNKNOWN: 'border-brand-surface-border bg-brand-surface-light text-brand-ink',
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
      className: 'border-brand-surface-border bg-brand-surface-light text-brand-ink',
      label: 'Hold',
    };
  }

  if (numeric > 0) {
    return {
      icon: TrendingUp,
      className: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
      label: 'Increase',
    };
  }

  return {
    icon: TrendingDown,
    className: 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger',
    label: 'Decrease',
  };
};

export default function PricingRecommendationCard({
  roomType = 'Unavailable',
  currentPrice = null,
  suggestedPrice = null,
  adjustmentPercent = null,
  reason = 'No pricing recommendation has been loaded.',
  riskLevel = 'UNKNOWN',
  source,
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
    <Card className="h-full rounded-[1.5rem] border border-brand-surface-border bg-white p-0 shadow-sm">
      <CardHeader className="p-5 pb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted">
              Room Type
            </p>
            <CardTitle className="mt-2 break-words text-xl font-black tracking-tight text-brand-ink">
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
            {source ? (
              <Badge variant="outline" className="rounded-full border-brand-surface-border bg-brand-surface-light px-3 py-1 text-brand-ink-muted">
                {source}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-muted">
              Current
            </p>
            <p className="mt-2 text-xl font-black text-brand-ink">{formatCurrency(currentPrice)}</p>
          </div>
          <div className="rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-muted">
              Suggested
            </p>
            <p className="mt-2 text-xl font-black text-brand-ink">{formatCurrency(suggestedPrice)}</p>
          </div>
          <div className={cn('rounded-2xl border p-4', adjustmentStyle.className)}>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
              <AdjustmentIcon className="h-4 w-4" />
              {adjustmentStyle.label}
            </div>
            <p className="mt-2 text-xl font-black">{formatAdjustment(adjustmentValue)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-brand-surface-border bg-brand-surface-light p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-muted">
            Reason
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-brand-ink">{reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
