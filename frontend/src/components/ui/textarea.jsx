import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "motion-input-focus-glow flex min-h-[60px] w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-all [transition-duration:var(--motion-normal)] [transition-timing-function:var(--ease-premium)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
