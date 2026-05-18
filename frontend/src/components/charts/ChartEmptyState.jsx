import { cn } from "@/lib/utils"
import { AlertTriangle, BarChart2 } from "lucide-react"

export function ChartEmptyState({
  title = "No data available",
  message = "There is no data to display for the selected range.",
  variant = "empty",
  action,
  className
}) {
  const isError = variant === "error"
  const Icon = isError ? AlertTriangle : BarChart2

  return (
    <div className={cn("flex min-h-[250px] w-full flex-col items-center justify-center rounded-[1.2rem] border border-dashed p-8 text-center", isError ? "border-brand-danger/30 bg-brand-danger/10" : "border-brand-surface-border bg-brand-surface-light", className)}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl mb-4", isError ? "bg-white text-brand-danger shadow-sm" : "bg-white text-brand-ink-hint shadow-sm")}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={cn("text-sm font-black uppercase tracking-[0.16em]", isError ? "text-brand-ink" : "text-brand-ink-muted")}>
        {title}
      </h3>
      <p className={cn("mt-2 max-w-sm text-sm font-medium leading-6", isError ? "text-brand-danger/80" : "text-brand-ink-muted")}>
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
