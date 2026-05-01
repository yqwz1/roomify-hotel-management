import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

const STATUS_CONFIG = {
  ONLINE: {
    label: 'Online',
    icon: CheckCircle2,
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClassName: 'bg-emerald-500',
    panelClassName: 'border-emerald-200 bg-emerald-50/70',
    defaultMessage: 'AI model metadata is available through Spring Boot.',
  },
  OFFLINE: {
    label: 'Offline',
    icon: WifiOff,
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-800',
    dotClassName: 'bg-rose-500',
    panelClassName: 'border-rose-200 bg-rose-50/70',
    defaultMessage: 'The AI service is offline. Spring Boot will return an unavailable state or safe fallback payloads.',
  },
  SAFE_DEMO_FALLBACK: {
    label: 'Safe Demo Fallback',
    icon: ShieldCheck,
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    dotClassName: 'bg-amber-500',
    panelClassName: 'border-amber-200 bg-amber-50/70',
    defaultMessage: 'Spring Boot reports fallback mode, so demo-safe AI responses may be shown.',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock3,
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-800',
    dotClassName: 'bg-sky-500',
    panelClassName: 'border-sky-200 bg-sky-50/70',
    defaultMessage: 'Loading AI service status and model metadata through Spring Boot.',
  },
};

const unavailable = 'Unavailable';

const formatNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat('en-US').format(numeric) : unavailable;
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

const formatDate = (value) => {
  if (!value) return unavailable;

  const date = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatOccupancyMae = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric)} pts`
    : unavailable;
};

export default function AiStatusBanner({
  status = 'PENDING',
  modelType,
  trainingRows,
  lastTrained,
  revenueMae,
  occupancyMae,
  source = 'Spring Boot',
  message,
  loading = false,
  error = null,
}) {
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const statusMessage = error || message || statusConfig.defaultMessage;
  const metrics = [
    {
      label: 'Model Type',
      value: loading ? 'Loading...' : modelType || unavailable,
      icon: Activity,
    },
    {
      label: 'Training Rows',
      value: loading ? 'Loading...' : formatNumber(trainingRows),
      icon: Database,
    },
    {
      label: 'Last Trained',
      value: loading ? 'Loading...' : formatDate(lastTrained),
      icon: Clock3,
    },
    {
      label: 'Revenue MAE',
      value: loading ? 'Loading...' : formatCurrency(revenueMae),
      icon: Activity,
    },
    {
      label: 'Occupancy MAE',
      value: loading ? 'Loading...' : formatOccupancyMae(occupancyMae),
      icon: Activity,
    },
  ];

  return (
    <Card className={cn('overflow-hidden rounded-[1.5rem] border p-0 shadow-sm', statusConfig.panelClassName)}>
      <CardHeader className="gap-4 p-5 pb-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
              <StatusIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-black tracking-tight text-zinc-950">
                  AI Service Status
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn('gap-2 rounded-full px-3 py-1', statusConfig.badgeClassName)}
                >
                  <span className={cn('h-2 w-2 rounded-full', statusConfig.dotClassName)} />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-700">
                {statusMessage}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-zinc-200 bg-white px-3 py-1 text-zinc-600">
            Source: {source || 'Spring Boot'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <p className="mt-2 break-words text-lg font-black text-zinc-950">{value}</p>
            </div>
          ))}
        </div>

        {status !== 'ONLINE' ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 text-sm font-medium leading-6 text-zinc-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <span>
              React uses Spring Boot as the integration boundary. It does not call FastAPI or
              external AI APIs directly.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
