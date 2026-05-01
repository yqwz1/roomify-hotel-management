import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { useId } from "react"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { ChartSkeleton } from "./ChartSkeleton"
import { ChartEmptyState } from "./ChartEmptyState"

export function TrendLineChart({
  data = [],
  xKey = "date",
  yKey = "value",
  valueFormatter,
  labelFormatter,
  color = "#0f766e",
  height = 300,
  loading = false,
  error = null,
  emptyMessage = "No trend data available.",
  variant = "line",
  maxPoints = 0,
  fillColor,
  gradientId
}) {
  const reactId = useId()
  const safeData = Array.isArray(data) ? data : []
  const resolvedGradientId = gradientId || `trend-fill-${reactId.replace(/:/g, "")}-${yKey}`
  const areaFillColor = fillColor || color

  if (loading) {
    return <ChartSkeleton height={height} />
  }

  if (error) {
    return <ChartEmptyState variant="error" title="Trend data unavailable" message={error} />
  }

  const displayData = maxPoints > 0 && safeData.length > maxPoints ? safeData.slice(-maxPoints) : safeData

  if (!displayData || displayData.length === 0) {
    return <ChartEmptyState title="No Data" message={emptyMessage} />
  }

  return (
    <ChartContainer style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "area" ? (
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={resolvedGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaFillColor} stopOpacity={fillColor ? 1 : 0.25} />
                <stop offset="95%" stopColor={areaFillColor} stopOpacity={fillColor ? 0.08 : 0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: "bold" }}
              tickFormatter={labelFormatter}
              minTickGap={30}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: "bold" }}
              tickFormatter={valueFormatter}
              width={60}
            />
            <Tooltip
              content={<ChartTooltipContent formatter={valueFormatter} labelFormatter={labelFormatter} />}
              cursor={{ stroke: "#d4d4d8", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${resolvedGradientId})`}
              activeDot={{ r: 5, fill: "#ffffff", stroke: color, strokeWidth: 3 }}
            />
          </AreaChart>
        ) : (
          <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: "bold" }}
              tickFormatter={labelFormatter}
              minTickGap={30}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: "bold" }}
              tickFormatter={valueFormatter}
              width={60}
            />
            <Tooltip
              content={<ChartTooltipContent formatter={valueFormatter} labelFormatter={labelFormatter} />}
              cursor={{ stroke: "#d4d4d8", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#ffffff", stroke: color, strokeWidth: 3 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartContainer>
  )
}
