import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  /** Used where a number needs a caveat, "estimated visitors" above all. */
  hint?: string
}) {
  return (
    <div className="border-border/60 bg-card rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Icon className="size-3.5" />
        <span>{label}</span>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={hint}>
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </div>
  )
}
