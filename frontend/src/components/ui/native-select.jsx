import * as React from "react"

import { cn } from "@/lib/utils"

const NativeSelect = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "motion-input-focus-glow max-w-full min-w-0 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
