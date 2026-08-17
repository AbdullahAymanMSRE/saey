"use client"

import { useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  Car,
  Download,
  Eye,
  Languages,
  MessageCircle,
  Plus,
  QrCode,
  Store,
  Users,
} from "lucide-react"

import { StatCard } from "@/components/app/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "@/i18n/navigation"
import { api } from "@/lib/api"
import { formatNumber } from "@/lib/format"

type Stats = {
  days: number
  visitors: number
  showroomViews: number
  carViews: number
  contactClicks: number
  counts: { published: number; draft: number; sold: number; rentedOut: number }
  needingTranslation: number
  harajChanges: number
  topCars: {
    carId: string | null
    views: number
    titleAr: string | null
    titleEn: string | null
    status: string
  }[]
  daily: { day: string; visitors: number; views: number }[]
}

/**
 * The dashboard and the old standalone statistics screen were reading the same
 * query and splitting one story across two tabs, so they are one page now.
 */
export function DashboardOverview() {
  const t = useTranslations("Dashboard")
  const tStats = useTranslations("Stats")
  const tCars = useTranslations("Cars")
  const locale = useLocale()

  const { data, isPending } = useQuery({
    queryKey: ["agency-stats", 30],
    queryFn: () => api<Stats>("/api/agency/stats?days=30"),
  })

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const n = (v: number) => formatNumber(v, locale)
  const peak = Math.max(1, ...(data?.daily.map((d) => d.visitors) ?? [1]))
  const hasTraffic = (data?.showroomViews ?? 0) + (data?.carViews ?? 0) > 0

  return (
    <div className="space-y-8">
      {/* Inventory: what the agency owns right now. */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Car}
          label={t("publishedCars")}
          value={n(data?.counts.published ?? 0)}
        />
        <StatCard
          icon={Car}
          label={t("draftCars")}
          value={n(data?.counts.draft ?? 0)}
        />
        <StatCard
          icon={Car}
          label={t("soldCars")}
          value={n(data?.counts.sold ?? 0)}
        />
        <StatCard
          icon={QrCode}
          label={tCars("RENTED_OUT")}
          value={n(data?.counts.rentedOut ?? 0)}
        />
      </section>

      {/* Only what is genuinely waiting on them, never an empty tray. */}
      {(!!data?.counts.draft ||
        !!data?.needingTranslation ||
        !!data?.harajChanges) && (
        <section className="space-y-2">
          {!!data?.counts.draft && (
            <Notice
              icon={AlertCircle}
              text={t("draftsWaiting", { count: data.counts.draft })}
              href="/app/dashboard/cars?status=DRAFT"
              action={tCars("title")}
            />
          )}
          {!!data?.needingTranslation && (
            <Notice
              icon={Languages}
              text={t("translationsMissing", { count: data.needingTranslation })}
              href="/app/dashboard/cars?status=DRAFT"
              action={tCars("title")}
            />
          )}
          {!!data?.harajChanges && (
            <Notice
              icon={Download}
              text={t("harajChanges", { count: data.harajChanges })}
              href="/app/dashboard/cars"
              action={tCars("title")}
            />
          )}
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/app/dashboard/cars/new">
            <Plus className="size-4" />
            {t("quickAdd")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/dashboard/import">
            <Download className="size-4" />
            {t("quickImport")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/dashboard/qr">
            <QrCode className="size-4" />
            {t("quickQr")}
          </Link>
        </Button>
      </section>

      {/* Traffic: what the outside world did with it. */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {tStats("title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {tStats("subtitle", { days: data?.days ?? 30 })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label={tStats("visitors")}
            value={n(data?.visitors ?? 0)}
            hint={tStats("estimateNote")}
          />
          <StatCard
            icon={Store}
            label={tStats("showroomViews")}
            value={n(data?.showroomViews ?? 0)}
          />
          <StatCard
            icon={Eye}
            label={tStats("carViews")}
            value={n(data?.carViews ?? 0)}
          />
          <StatCard
            icon={MessageCircle}
            label={tStats("contactClicks")}
            value={n(data?.contactClicks ?? 0)}
          />
        </div>

        {!hasTraffic ? (
          <div className="border-border/60 rounded-xl border border-dashed py-14 text-center">
            <p className="text-muted-foreground text-sm">{tStats("noData")}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border-border/60 bg-card rounded-xl border p-5">
              <h3 className="text-sm font-medium">{tStats("trend")}</h3>
              {/* A plain bar strip rather than a charting dependency, this is a
                  30-value series and a library would outweigh it. */}
              {/* max-w keeps a single day from stretching into a solid block;
                  a new agency has one bar, not thirty. */}
              <div className="mt-4 flex h-32 items-end justify-start gap-1">
                {data?.daily.map((day) => (
                  <div
                    key={day.day}
                    title={`${day.day}: ${day.visitors}`}
                    className="bg-primary/70 hover:bg-primary min-w-1 max-w-8 flex-1 rounded-t transition-colors"
                    style={{
                      height: `${Math.max(4, (day.visitors / peak) * 100)}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="border-border/60 bg-card rounded-xl border p-5">
              <h3 className="mb-3 text-sm font-medium">{tStats("topCars")}</h3>
              <ol className="space-y-2">
                {data?.topCars.map((car, i) => (
                  <li key={car.carId} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">
                      {(locale === "en" ? car.titleEn : car.titleAr) ??
                        car.titleAr ??
                        "-"}
                    </span>
                    {car.status !== "PUBLISHED" && (
                      <Badge variant="secondary">
                        {tCars(car.status as "SOLD")}
                      </Badge>
                    )}
                    <span className="tabular-nums">{n(car.views)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-xs">{tStats("estimateNote")}</p>
      </section>
    </div>
  )
}

function Notice({
  icon: Icon,
  text,
  href,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
  href: string
  action: string
}) {
  return (
    <div className="border-border/60 bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1">{text}</span>
      <Button asChild size="sm" variant="ghost">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  )
}
