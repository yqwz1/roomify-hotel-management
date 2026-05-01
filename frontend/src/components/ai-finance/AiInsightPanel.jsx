import {
  BarChart3,
  BedDouble,
  Bot,
  Loader2,
  MessageSquareText,
  Percent,
  TrendingUp,
} from 'lucide-react';
import AiFallbackBanner from './AiFallbackBanner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

const INTENTS = [
  {
    intent: 'REVENUE_FORECAST',
    label: 'Forecast next 30 days revenue',
    icon: TrendingUp,
  },
  {
    intent: 'PRICING_RECOMMENDATION',
    label: 'Recommend prices for next week',
    icon: BarChart3,
  },
  {
    intent: 'OCCUPANCY_ANALYSIS',
    label: 'Analyze occupancy trend',
    icon: Percent,
  },
  {
    intent: 'ROOM_TYPE_PERFORMANCE',
    label: 'Show best performing room type',
    icon: BedDouble,
  },
];

const titleize = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatMetricValue = (key, value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? 'Unavailable');

  const normalizedKey = String(key).toLowerCase();
  if (normalizedKey.includes('revenue') || normalizedKey.includes('price')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  if (normalizedKey.includes('occupancy') || normalizedKey.includes('percent')) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric)}%`;
  }

  if (normalizedKey.includes('confidence')) {
    const confidence = numeric <= 1 ? numeric * 100 : numeric;
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(confidence)}%`;
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric);
};

export default function AiInsightPanel({
  response,
  loading = false,
  error = null,
  onAskIntent,
}) {
  const metrics = response?.metrics && typeof response.metrics === 'object'
    ? Object.entries(response.metrics)
    : [];
  const isFallback = response?.source === 'SAFE_DEMO_FALLBACK';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {INTENTS.map(({ intent, label, icon: Icon }) => (
          <Button
            key={intent}
            type="button"
            variant="outline"
            className="h-auto justify-start rounded-2xl border-zinc-200 bg-white px-4 py-4 text-left text-zinc-900 shadow-sm hover:bg-zinc-50"
            disabled={loading}
            onClick={() => onAskIntent?.(intent)}
          >
            <Icon className="h-5 w-5 text-cyan-700" />
            <span className="whitespace-normal text-sm font-black leading-5">{label}</span>
          </Button>
        ))}
      </div>

      {isFallback ? (
        <AiFallbackBanner
          source={response.source}
          message="AI service is currently unavailable. Showing a safe demo fallback forecast."
        />
      ) : null}

      {error ? (
        <Card className="rounded-[1.35rem] border border-rose-200 bg-rose-50 p-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-rose-700 shadow-sm">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-rose-950">Insight unavailable</p>
                <p className="mt-1 text-sm font-medium leading-6 text-rose-900/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[1.5rem] border border-zinc-200 bg-white p-0 shadow-sm">
        <CardContent className="p-5">
          {loading ? (
            <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
              Loading AI insight through Spring Boot...
            </div>
          ) : response?.answer ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                      {titleize(response.intent || 'AI insight')}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-zinc-700">
                      {response.answer}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'w-fit rounded-full px-3 py-1',
                    isFallback
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  )}
                >
                  {response.source || 'Spring Boot'}
                </Badge>
              </div>

              {metrics.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {metrics.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                        {titleize(key)}
                      </p>
                      <p className="mt-2 break-words text-lg font-black text-zinc-950">
                        {formatMetricValue(key, value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-zinc-950">Choose a demo-safe insight</p>
                <p className="mt-1 text-sm font-medium leading-6 text-zinc-600">
                  Use the predefined buttons above. No OpenAI or free-text chatbot is required for
                  the supervisor demo.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
