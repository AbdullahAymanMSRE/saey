"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname, useRouter } from "@/i18n/navigation"
import { localeName } from "@/lib/format"

type Facets = {
  makes: { id: string; nameAr: string; nameEn: string }[]
  years: number[]
  cities: string[]
}

const ANY = "__any"

/**
 * Filters live in the URL, so a filtered view is shareable, the back button
 * works, and the server component re-renders with real data rather than the
 * client filtering an already-shipped list.
 */
export function ShowroomFilters({ facets }: { facets: Facets }) {
  const t = useTranslations("Showroom")
  const tCity = useTranslations("Cities")
  const tCar = useTranslations("Cars")
  const locale = useLocale()
  const router = useRouter()
  // next-intl's pathname excludes the locale segment, and its router adds the
  // right one back, so filtering on /en/<slug> never drops to the Arabic page.
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [showMore, setShowMore] = useState(
    ["year", "gear", "condition", "city"].some((k) => params.get(k)),
  )
  const [q, setQ] = useState(params.get("q") ?? "")

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (!value || value === ANY) next.delete(key)
    else next.set(key, value)
    const query = next.toString()
    startTransition(() =>
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }),
    )
  }

  const activeCount = ["make", "year", "gear", "condition", "city", "q"].filter(
    (k) => params.get(k),
  ).length

  return (
    <div className="space-y-4" data-pending={pending ? "" : undefined}>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={params.get("type") ?? "ALL"}
          onValueChange={(v) => set("type", v === "ALL" ? null : v)}
        >
          <TabsList>
            <TabsTrigger value="ALL">{t("allCars")}</TabsTrigger>
            <TabsTrigger value="SALE">{t("carsForSale")}</TabsTrigger>
            <TabsTrigger value="RENT">{t("carsForRent")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <form
          className="min-w-[12rem] flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            set("q", q || null)
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => set("q", q || null)}
            placeholder={t("searchPlaceholder")}
            className="h-10 text-base"
          />
        </form>

        {facets.makes.length > 0 && (
          <Select
            value={params.get("make") ?? ANY}
            onValueChange={(v) => set("make", v)}
          >
            <SelectTrigger className="w-[11rem] text-base">
              <SelectValue placeholder={t("anyMake")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyMake")}</SelectItem>
              {facets.makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {localeName(make, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="ghost"
          onClick={() => setShowMore((v) => !v)}
          className="gap-1.5 text-base"
        >
          <SlidersHorizontal className="size-4" />
          {t("moreFilters")}
        </Button>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            className="text-muted-foreground gap-1 text-base"
            onClick={() =>
              startTransition(() => router.replace(pathname, { scroll: false }))
            }
          >
            <X className="size-3.5" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {showMore && (
        <div className="border-border/60 grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={params.get("year") ?? ANY}
            onValueChange={(v) => set("year", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("anyYear")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyYear")}</SelectItem>
              {facets.years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.get("gear") ?? ANY}
            onValueChange={(v) => set("gear", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("anyGear")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyGear")}</SelectItem>
              <SelectItem value="AUTO">{tCar("AUTO")}</SelectItem>
              <SelectItem value="MANUAL">{tCar("MANUAL")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={params.get("condition") ?? ANY}
            onValueChange={(v) => set("condition", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("anyCondition")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyCondition")}</SelectItem>
              <SelectItem value="NEW">{tCar("NEW")}</SelectItem>
              <SelectItem value="USED">{tCar("USED")}</SelectItem>
            </SelectContent>
          </Select>

          {facets.cities.length > 0 && (
            <Select
              value={params.get("city") ?? ANY}
              onValueChange={(v) => set("city", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("anyCity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("anyCity")}</SelectItem>
                {facets.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {tCity(city as "RIYADH")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
