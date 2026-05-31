import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white shadow-brand-cta hover:-translate-y-0.5 hover:bg-brand-primary-deep hover:shadow-brand-cta-hover",
        destructive:
          "bg-brand-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-danger/90",
        outline:
          "border border-brand-surface-border bg-white text-brand-ink shadow-sm hover:-translate-y-0.5 hover:border-brand-primary/35 hover:bg-brand-surface-light hover:text-brand-primary-deep",
        secondary:
          "bg-brand-primary-tint text-brand-primary-deep shadow-sm hover:-translate-y-0.5 hover:bg-brand-primary-tint/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        unstyled:
          "border-0 bg-transparent text-inherit shadow-none hover:bg-transparent hover:text-inherit",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
        none: "h-auto p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const unstyledClassName =
    variant === "unstyled"
      ? cn(
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          className
        )
      : null

  return (
    <Comp
      className={unstyledClassName ?? cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
