import { cn } from "@/lib/utils"
import { ChartCard } from "./ChartCard"

export function ChartSkeleton({ height = "h-64", rows = 1, className }) {
  const numericHeight = Number(height)
  const heightStyle = Number.isFinite(numericHeight) ? { height: numericHeight } : undefined
  const heightClassName = heightStyle ? null : height

  return (
    <ChartCard className={className}>
      <div className="animate-pulse space-y-4 pt-4">
        <div className="h-5 w-1/3 rounded-full bg-brand-surface-border" />
        <div className="h-4 w-1/2 rounded-full bg-brand-primary-tint" />
        <div className={cn("w-full rounded-xl bg-brand-surface-light", heightClassName)} style={heightStyle} />
        {rows > 1 && (
          <div className="grid min-w-0 grid-cols-3 gap-4 pt-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-brand-primary-tint" />
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  )
}
