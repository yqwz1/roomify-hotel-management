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
    <div className={cn("flex min-h-[250px] w-full flex-col items-center justify-center rounded-[1.2rem] border border-dashed p-8 text-center", isError ? "border-rose-200 bg-rose-50" : "border-zinc-200 bg-zinc-50", className)}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl mb-4", isError ? "bg-white text-rose-600 shadow-sm" : "bg-white text-zinc-400 shadow-sm")}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={cn("text-sm font-black uppercase tracking-[0.16em]", isError ? "text-rose-950" : "text-zinc-500")}>
        {title}
      </h3>
      <p className={cn("mt-2 max-w-sm text-sm font-medium leading-6", isError ? "text-rose-900/80" : "text-zinc-500")}>
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
