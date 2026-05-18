import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ChartCard({
  title,
  description,
  children,
  action,
  footer,
  className,
  contentClassName,
  ...props
}) {
  return (
    <Card className={cn("rounded-[1.4rem] border border-brand-surface-border bg-white p-0 shadow-sm", className)} {...props}>
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-5 pb-4">
          <div className="min-w-0">
            {title && <CardTitle className="text-sm font-black uppercase tracking-[0.16em] text-brand-ink">{title}</CardTitle>}
            {description && <CardDescription className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">{description}</CardDescription>}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("p-5 pt-0", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="p-5 pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
