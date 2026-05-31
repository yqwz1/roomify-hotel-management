import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "roomify-field flex h-12 min-w-0 py-1 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-brand-ink-hint/70 disabled:opacity-70 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
