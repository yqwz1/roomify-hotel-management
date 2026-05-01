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
    <Card className={cn('rounded-[1.35rem] border border-amber-200 bg-amber-50/90 p-0 shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-amber-950">Safe demo fallback active</p>
              <p className="mt-1 text-sm font-medium leading-6 text-amber-900">
                {message || DEFAULT_MESSAGE}
              </p>
              <p className="mt-1 text-xs font-bold text-amber-800/80">
                This is deterministic demo fallback data, not a cached last forecast.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-2 rounded-full border-amber-300 bg-white px-3 py-1 text-amber-800"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {source || 'Fallback'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
