import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

const DEFAULT_MESSAGE =
  'AI service is currently unavailable. Showing a safe demo fallback forecast.';

export default function AiFallbackBanner({
  message = DEFAULT_MESSAGE,
  source = 'SAFE_DEMO_FALLBACK',
  className,
}) {
  return (
    <Card className={cn('rounded-[1.35rem] border border-brand-warning/30 bg-brand-warning/10 p-0 shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex min-w-0 h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-brand-warning shadow-sm break-words">
              <AlertTriangle className="h-5 w-5 shrink-0" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-brand-ink break-words">Safe demo fallback active</p>
              <p className="mt-1 text-sm font-medium leading-6 text-brand-warning break-words">
                {message || DEFAULT_MESSAGE}
              </p>
              <p className="mt-1 text-xs font-bold text-brand-warning/80 break-words">
                This is deterministic demo fallback data, not a cached last forecast.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-2 rounded-full border-brand-warning/40 bg-white px-3 py-1 text-brand-warning"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            {source || 'Fallback'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
