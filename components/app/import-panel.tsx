"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useFormatter, useTranslations } from "next-intl"
import { AlertTriangle, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { api } from "@/lib/api"

type Run = {
  id: string
  status: "RUNNING" | "COMPLETED" | "FAILED"
  pages: number
  fetched: number
  imported: number
  changed: number
  skipped: number
  stopReason: string | null
  error: string | null
  logs: string[]
  startedAt: string
  finishedAt: string | null
}

export function ImportPanel() {
  const t = useTranslations("Import")
  const tc = useTranslations("Common")
  const format = useFormatter()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["import"],
    queryFn: () =>
      api<{ harajUsername: string | null; run: Run | null; running: boolean }>(
        "/api/agency/import",
      ),
    // Polled only while a run is live; the DB row is the source of truth, so a
    // run that survives a page reload keeps reporting progress.
    refetchInterval: (query) =>
      query.state.data?.running ? 2000 : false,
  })

  const start = useMutation({
    mutationFn: () => api("/api/agency/import", { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["import"] })
      void queryClient.invalidateQueries({ queryKey: ["cars"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const run = data?.run
  const running = data?.running

  if (data && !data.harajUsername) {
    return (
      <div className="border-border/60 mx-auto max-w-2xl rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">{t("noUsername")}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("noUsernameHelp")}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="border-border/60 bg-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">{t("account")}</p>
            <p className="font-medium">{data?.harajUsername ?? "-"}</p>
          </div>
          <Button
            onClick={() => start.mutate()}
            disabled={running || start.isPending}
          >
            {running || start.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {running ? t("running") : t("start")}
          </Button>
        </div>

        {running && (
          <p className="text-muted-foreground mt-3 text-sm">
            {t("runningHelp")}
          </p>
        )}

        {run && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label={t("pages")} value={run.pages} />
            <Metric label={t("fetched")} value={run.fetched} />
            <Metric label={t("imported")} value={run.imported} />
            <Metric label={t("changed")} value={run.changed} />
          </div>
        )}

        {run?.status === "COMPLETED" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">{t("completed")}</p>
            {/* Haraj reports no total, so completeness is its word, said out
                loud rather than implied by a tidy number. */}
            <p className="text-muted-foreground text-xs">{t("warnNoTotal")}</p>
            {run.stopReason === "CEILING" && (
              <p className="text-destructive flex items-center gap-1.5 text-xs">
                <AlertTriangle className="size-3.5" />
                {t("warnCeiling")}
              </p>
            )}
            {run.logs?.map((line, i) => (
              <p key={i} className="text-muted-foreground text-xs">
                {line}
              </p>
            ))}
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/app/dashboard/cars?status=DRAFT">
                {t("reviewDrafts")}
              </Link>
            </Button>
          </div>
        )}

        {run?.status === "FAILED" && (
          <div className="mt-4">
            <p className="text-destructive text-sm font-medium">{t("failed")}</p>
            <p className="text-muted-foreground mt-1 text-xs">{run.error}</p>
          </div>
        )}

        {run && (
          <p className="text-muted-foreground mt-4 text-xs">
            {t("lastRun", {
              when: format.dateTime(new Date(run.startedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
        {!run && (
          <p className="text-muted-foreground mt-4 text-xs">{t("never")}</p>
        )}
      </div>

      <div className="border-border/60 rounded-xl border p-5">
        <h2 className="text-sm font-medium">{t("howItWorks")}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("howItWorksBody")}
        </p>
        <span className="sr-only">{tc("appName")}</span>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
