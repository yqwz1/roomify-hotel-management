import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { ChartSkeleton } from "./ChartSkeleton"
import { ChartEmptyState } from "./ChartEmptyState"

export function RadialStatusChart({
  value,
  max = 100,
  label = "Status",
  valueFormatter,
  color = "hsl(var(--chart-2))",
  trackColor = "var(--chart-track)",
  height = 200,
  loading = false,
  error = null,
  emptyMessage = "No status data available."
}) {
  if (loading) {
    return <ChartSkeleton height={height} />
  }

  if (error) {
    return <ChartEmptyState variant="error" title="Data unavailable" message={error} />
  }

  if (value === undefined || value === null) {
    return <ChartEmptyState title="No Data" message={emptyMessage} />
  }

  const safeValue = Math.min(Math.max(Number(value) || 0, 0), max)
  const remainder = Math.max(max - safeValue, 0)
  
  const data = [
    { name: label, value: safeValue },
    { name: "Remaining", value: remainder }
  ]

  const displayValue = valueFormatter ? valueFormatter(safeValue) : safeValue

  return (
    <ChartContainer style={{ height }} className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
          >
            <Cell fill={color} />
            <Cell fill={trackColor} />
          </Pie>
          <Tooltip 
            content={<ChartTooltipContent formatter={valueFormatter} />} 
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {label}
        </span>
        <span className="mt-1 text-3xl font-black tracking-tight text-zinc-950">
          {displayValue}
        </span>
      </div>
    </ChartContainer>
  )
}
