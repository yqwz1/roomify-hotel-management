import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { ChartSkeleton } from "./ChartSkeleton"
import { ChartEmptyState } from "./ChartEmptyState"

export function DistributionBarChart({
  data = [],
  labelKey = "name",
  valueKey = "value",
  valueFormatter,
  color = "#264B6B",
  colors = [],
  height = 300,
  loading = false,
  error = null,
  emptyMessage = "No distribution data available.",
  layout = "horizontal"
}) {
  const safeData = Array.isArray(data) ? data : []

  if (loading) {
    return <ChartSkeleton height={height} />
  }

  if (error) {
    return <ChartEmptyState variant="error" title="Data unavailable" message={error} />
  }

  if (safeData.length === 0) {
    return <ChartEmptyState title="No Data" message={emptyMessage} />
  }

  return (
    <ChartContainer style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={safeData}
          layout={layout}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="4 6" horizontal={layout === "horizontal"} vertical={layout === "vertical"} stroke="#E8E3D6" />
          <XAxis
            type={layout === "horizontal" ? "category" : "number"}
            dataKey={layout === "horizontal" ? labelKey : undefined}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5C6B7A", fontSize: 11, fontWeight: "bold" }}
            tickFormatter={layout === "horizontal" ? undefined : valueFormatter}
            tickMargin={12}
            hide={layout === "vertical"}
          />
          <YAxis
            type={layout === "horizontal" ? "number" : "category"}
            dataKey={layout === "horizontal" ? undefined : labelKey}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5C6B7A", fontSize: 11, fontWeight: "bold" }}
            tickFormatter={layout === "horizontal" ? valueFormatter : undefined}
            width={layout === "horizontal" ? 60 : 100}
            hide={layout === "horizontal"}
          />
          <Tooltip
            content={<ChartTooltipContent formatter={valueFormatter} />}
            cursor={{ fill: "rgba(0,0,0,0.04)", radius: 4 }}
          />
          <Bar dataKey={valueKey} radius={4}>
            {safeData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length] || color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
