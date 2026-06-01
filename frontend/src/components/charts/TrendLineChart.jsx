import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer
} from "recharts"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { ChartSkeleton } from "./ChartSkeleton"
import { ChartEmptyState } from "./ChartEmptyState"
import { seasonShortLabel, seasonTypeName } from "@/utils/seasonLabels"

// Color per season type ONLY — localized names live in utils/seasonLabels.js and are
// resolved via i18n. The fill is intentionally light so the line stays readable.
// These are historical (Umm al-Qura, approximate) seasons, not official religious dates.
const SEASON_META = {
  RAMADAN: { color: "#1D9E75", fill: "rgba(29, 158, 117, 0.12)" },
  HAJJ_ADHA: { color: "#D4A017", fill: "rgba(212, 160, 23, 0.16)" },
  EID_FITR: { color: "#0E7490", fill: "rgba(14, 116, 144, 0.12)" },
  SUMMER: { color: "#EA7C2B", fill: "rgba(234, 124, 43, 0.12)" }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
// Bands narrower than this rely on fill + legend + tooltip only (no text label),
// e.g. the 3-day Eid al-Fitr band.
const SEASON_LABEL_MIN_DAYS = 7
// Band labels are staggered across two rows to avoid horizontal collisions between
// adjacent bands. Row 0 sits near the top of the plot; row 1 is one row below.
const SEASON_LABEL_TOP_OFFSET = 12
const SEASON_LABEL_ROW_HEIGHT = 16
const MIN_Y_AXIS_WIDTH = 76
const MAX_Y_AXIS_WIDTH = 112

const bandWidthDays = (area) =>
  Number.isFinite(area.x1) && Number.isFinite(area.x2) ? (area.x2 - area.x1) / MS_PER_DAY : 0

const formatAxisValue = (value, formatter) => {
  const formatted = formatter ? formatter(value) : value
  return formatted === null || formatted === undefined ? "" : String(formatted)
}

const estimateYAxisWidth = (data, yKey, formatter) => {
  const values = data
    .map((item) => Number(item?.[yKey]))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return MIN_Y_AXIS_WIDTH

  const candidates = [0, Math.min(...values), Math.max(...values)]
  const longestLabel = candidates.reduce((longest, value) => {
    const label = formatAxisValue(value, formatter)
    return label.length > longest.length ? label : longest
  }, "")

  return Math.min(MAX_Y_AXIS_WIDTH, Math.max(MIN_Y_AXIS_WIDTH, Math.ceil(longestLabel.length * 7.5) + 18))
}

function renderYAxisTick({ x, y, payload }, formatter) {
  return (
    <text
      x={x - 8}
      y={y}
      textAnchor="end"
      dominantBaseline="central"
      fill="#5C6B7A"
      fontSize={11}
      fontWeight="bold"
      style={{ direction: "ltr", unicodeBidi: "isolate" }}
    >
      {formatAxisValue(payload?.value, formatter)}
    </text>
  )
}

// Custom band label: staggered row, edge-clamped anchor, and a semi-transparent
// white rounded backing rect so the text stays readable over the gridlines.
function renderSeasonBandLabel(viewBox, { text, color, row, anchorMode, isRtl }) {
  if (!viewBox) return null
  const { x, y, width } = viewBox
  const centerY = y + SEASON_LABEL_TOP_OFFSET + row * SEASON_LABEL_ROW_HEIGHT
  const padX = 5

  let textX
  let textAnchor
  if (anchorMode === "start") {
    textAnchor = "start"
    textX = x + padX
  } else if (anchorMode === "end") {
    textAnchor = "end"
    textX = x + width - padX
  } else {
    textAnchor = "middle"
    textX = x + width / 2
  }

  // SVG can't measure text synchronously; estimate the box (Arabic glyphs ~8px at 11px bold).
  const approxTextW = text.length * 8 + 10
  let rectX
  if (anchorMode === "start") rectX = textX - 4
  else if (anchorMode === "end") rectX = textX - approxTextW + 4
  else rectX = textX - approxTextW / 2
  const rectH = 16

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={rectX} y={centerY - rectH / 2} width={approxTextW} height={rectH} rx={4} fill="#ffffff" fillOpacity={0.82} />
      <text
        x={textX}
        y={centerY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fill={color}
        fontSize={11}
        fontWeight="bold"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        {text}
      </text>
    </g>
  )
}

const SeasonLegend = ({ types, t, isRtl }) => (
  <div dir={isRtl ? "rtl" : "ltr"} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
    {types.map((type) => {
      const meta = SEASON_META[type]
      if (!meta) return null
      return (
        <span key={type} className="flex items-center gap-1.5 text-xs font-bold text-brand-ink-muted">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: meta.color }} />
          {seasonTypeName(type, t)}
        </span>
      )
    })}
  </div>
)

// `seasonName` is already localized (full name + locale-correct year) by ForecastChart,
// so the tooltip just renders it under the correct text direction.
const makeSeasonTooltipExtra = (isRtl) => (payload) => {
  const seasonName = payload?.[0]?.payload?.seasonName
  if (!seasonName) return null
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="mt-2 border-t border-brand-surface-border pt-2 text-xs font-bold text-brand-ink-muted">
      {seasonName}
    </div>
  )
}

export function TrendLineChart({
  data = [],
  xKey = "date",
  yKey = "value",
  valueFormatter,
  labelFormatter,
  color = "#264B6B",
  height = 300,
  loading = false,
  error = null,
  emptyMessage = "No trend data available.",
  variant = "line",
  maxPoints = 0,
  fillColor,
  gradientId,
  timeScale = false,
  referenceAreas = []
}) {
  const reactId = useId()
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const isRtl = String(language).startsWith("ar")
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

  const yAxisWidth = estimateYAxisWidth(displayData, yKey, valueFormatter)
  const yAxisTick = (tickProps) => renderYAxisTick(tickProps, valueFormatter)

  // The numeric/time axis is strictly opt-in via `timeScale`; without it the axis
  // renders exactly as before (category axis keyed by the string date).
  const safeAreas = timeScale && Array.isArray(referenceAreas) ? referenceAreas : []

  // When season bands are shown, their labels sit in the top ~36px of the plot.
  // Reserve headroom above the data so tall spikes don't render over the
  // "Hajj 1447" / "Ramadan" labels. No bands (e.g. the forecast chart) keeps the
  // default auto domain unchanged.
  const hasBands = safeAreas.length > 0
  const yDomain = hasBands
    ? [0, (dataMax) => Math.max(1, Math.ceil((Number(dataMax) * 1.22) / 5) * 5)]
    : undefined
  const xAxisProps = timeScale
    ? {
        dataKey: xKey,
        type: "number",
        scale: "time",
        domain: ["dataMin", "dataMax"]
      }
    : { dataKey: xKey }

  const tooltipProps = timeScale
    ? {
        content: (
          <ChartTooltipContent
            formatter={valueFormatter}
            labelFormatter={labelFormatter}
            renderExtra={makeSeasonTooltipExtra(isRtl)}
          />
        ),
        cursor: { stroke: "#8A95A1", strokeWidth: 1, strokeDasharray: "4 4" }
      }
    : {
        content: <ChartTooltipContent formatter={valueFormatter} labelFormatter={labelFormatter} />,
        cursor: { stroke: "#8A95A1", strokeWidth: 1, strokeDasharray: "4 4" }
      }

  // Decide which bands get a text label, then stagger them across two rows and
  // clamp the first/last anchors inward so edge labels aren't clipped.
  const labeledAreas = safeAreas
    .map((area, index) => ({ area, index, widthDays: bandWidthDays(area) }))
    .filter((entry) => entry.widthDays >= SEASON_LABEL_MIN_DAYS && entry.area.labelAr && SEASON_META[entry.area.type])
    .sort((a, b) => a.area.x1 - b.area.x1)

  const labelMetaByIndex = new Map()
  labeledAreas.forEach((entry, labelIdx) => {
    const anchorMode =
      labelIdx === 0 ? "start" : labelIdx === labeledAreas.length - 1 ? "end" : "middle"
    labelMetaByIndex.set(entry.index, { row: labelIdx % 2, anchorMode })
  })

  const seasonBands = safeAreas.map((area, index) => {
    const meta = SEASON_META[area.type]
    if (!meta) return null
    const labelMeta = labelMetaByIndex.get(index)
    const text = labelMeta ? seasonShortLabel(area, t, language) : null
    return (
      <ReferenceArea
        key={`season-${index}-${area.type}`}
        x1={area.x1}
        x2={area.x2}
        fill={meta.fill}
        fillOpacity={1}
        stroke="none"
        ifOverflow="hidden"
        label={
          labelMeta
            ? (labelProps) =>
                renderSeasonBandLabel(labelProps?.viewBox, {
                  text,
                  color: meta.color,
                  row: labelMeta.row,
                  anchorMode: labelMeta.anchorMode,
                  isRtl
                })
            : undefined
        }
      />
    )
  })

  const legendTypes = timeScale
    ? [...new Set(safeAreas.map((area) => area.type).filter((type) => SEASON_META[type]))]
    : []

  const chart =
    variant === "area" ? (
      <AreaChart data={displayData} margin={{ top: timeScale ? 18 : 10, right: timeScale ? 22 : 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={resolvedGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaFillColor} stopOpacity={fillColor ? 1 : 0.25} />
            <stop offset="95%" stopColor={areaFillColor} stopOpacity={fillColor ? 0.08 : 0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E8E3D6" />
        {seasonBands}
        <XAxis
          {...xAxisProps}
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          tick={{ fill: "#5C6B7A", fontSize: 11, fontWeight: "bold" }}
          tickFormatter={labelFormatter}
          minTickGap={30}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={yAxisTick}
          tickMargin={8}
          width={yAxisWidth}
          domain={yDomain}
        />
        <Tooltip {...tooltipProps} />
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
      <LineChart data={displayData} margin={{ top: timeScale ? 18 : 10, right: timeScale ? 22 : 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E8E3D6" />
        {seasonBands}
        <XAxis
          {...xAxisProps}
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          tick={{ fill: "#5C6B7A", fontSize: 11, fontWeight: "bold" }}
          tickFormatter={labelFormatter}
          minTickGap={30}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={yAxisTick}
          tickMargin={8}
          width={yAxisWidth}
          domain={yDomain}
        />
        <Tooltip {...tooltipProps} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: "#ffffff", stroke: color, strokeWidth: 3 }}
        />
      </LineChart>
    )

  const chartContainer = (
    <ChartContainer style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {chart}
      </ResponsiveContainer>
    </ChartContainer>
  )

  if (legendTypes.length === 0) {
    return chartContainer
  }

  return (
    <div className="flex flex-col gap-2">
      <SeasonLegend types={legendTypes} t={t} isRtl={isRtl} />
      {chartContainer}
    </div>
  )
}
