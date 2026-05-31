import * as React from "react"
import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full h-full min-h-[150px]", className)} {...props}>
        {children}
      </div>
    )
  }
)
ChartContainer.displayName = "Chart"

const ChartTooltipContent = React.forwardRef(
  ({ active, payload, label, className, formatter, labelFormatter, hideLabel = false, renderExtra, ...props }, ref) => {
    if (!active || !payload?.length) {
      return null
    }

    const displayLabel = labelFormatter ? labelFormatter(label) : label;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-brand-surface-border bg-white px-3 py-2 text-sm shadow-sm",
          className
        )}
        {...props}
      >
        {!hideLabel && displayLabel !== undefined && displayLabel !== null && displayLabel !== "" && (
          <div className="mb-2 font-medium text-brand-ink-muted">{displayLabel}</div>
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          {payload.map((item, index) => {
            const val = formatter ? formatter(item.value, item.name) : item.value
            return (
              <div key={index} className="flex min-w-0 items-center gap-2">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color || item.payload?.fill || "#000" }}
                />
                <span className="font-medium text-brand-ink break-words">
                  {item.name !== "value" && item.name ? `${item.name}: ` : ""}{val}
                </span>
              </div>
            )
          })}
        </div>
        {typeof renderExtra === "function" ? renderExtra(payload) : null}
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltipContent }
