import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex max-w-full shrink-0 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-white shadow hover:bg-brand-primary-hover",
        secondary:
          "border-brand-surface-border bg-brand-surface-light text-brand-ink-muted hover:bg-white",
        destructive:
          "border-transparent bg-brand-danger text-white shadow hover:bg-brand-danger/90",
        outline: "border-brand-surface-border bg-white/70 text-brand-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge }
