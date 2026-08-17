import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CarCard } from "@/components/showroom/car-card"
import { ShowroomFilters } from "@/components/showroom/showroom-filters"
import { ShowroomHeader } from "@/components/showroom/showroom-header"
import { ViewTracker } from "@/components/showroom/view-tracker"
import { AccentTheme } from "@/components/showroom/accent-theme"
import {
  getAgencyBySlug,
  getShowroomCars,
  getShowroomFacets,
  type ShowroomFilters as Filters,
} from "@/lib/showroom"
import { imageUrl } from "@/lib/image-url"

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return {}

  const name = (locale === "en" && agency.nameEn) || agency.nameAr
  const description =
    (locale === "en" ? agency.aboutEn : agency.aboutAr) ?? undefined

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      images: agency.coverPath ? [imageUrl(agency.coverPath, "full")] : undefined,
    },
  }
}

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }
  const num = (k: string) => {
    const v = Number(one(k))
    return Number.isFinite(v) ? v : undefined
  }
  const type = one("type")
  return {
    type: type === "SALE" || type === "RENT" ? type : undefined,
    make: one("make"),
    year: num("year"),
    gear: one("gear") === "AUTO" || one("gear") === "MANUAL" ? (one("gear") as "AUTO") : undefined,
    condition:
      one("condition") === "NEW" || one("condition") === "USED"
        ? (one("condition") as "NEW")
        : undefined,
    city: one("city"),
    q: one("q"),
    min: num("min"),
    max: num("max"),
    sort: one("sort") as Filters["sort"],
  }
}

export default async function ShowroomPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const agency = await getAgencyBySlug(slug)
  if (!agency) notFound()

  // An Arabic-only showroom has exactly one canonical URL. Redirecting rather
  // than rendering keeps a printed QR code landing somewhere correct and avoids
  // a duplicate-content page that is half-translated.
  if (locale === "en" && !agency.locales.includes("en")) {
    redirect(`/${slug}`)
  }

  const t = await getTranslations("Showroom")

  if (agency.suspended) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <p className="text-muted-foreground">{t("suspended")}</p>
      </main>
    )
  }

  const filters = readFilters(await searchParams)
  const [cars, facets] = await Promise.all([
    getShowroomCars(agency.id, filters),
    getShowroomFacets(agency.id),
  ])

  return (
    <>
      <AccentTheme color={agency.accentColor} />
      <ViewTracker agencyId={agency.id} type="SHOWROOM_VIEW" />
      <ShowroomHeader agency={agency} locale={locale} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <ShowroomFilters facets={facets} />

        <p className="text-muted-foreground mt-6">
          {t("resultCount", { count: cars.length })}
        </p>

        {cars.length === 0 ? (
          <div className="border-border/60 mt-6 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-lg">{t("noResults")}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} slug={slug} locale={locale} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
