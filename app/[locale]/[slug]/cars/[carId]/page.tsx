import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { AccentTheme } from "@/components/showroom/accent-theme"
import { CarGallery } from "@/components/showroom/car-gallery"
import { ContactCta } from "@/components/showroom/contact-cta"
import { ShowroomHeader } from "@/components/showroom/showroom-header"
import { ViewTracker } from "@/components/showroom/view-tracker"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { carName, formatPrice, isRtl, primaryRate } from "@/lib/format"
import { getAgencyBySlug, getShowroomCar } from "@/lib/showroom"
import { imageUrl } from "@/lib/image-url"
import { carUrl, whatsappUrl } from "@/lib/urls"

type Props = {
  params: Promise<{ locale: string; slug: string; carId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, carId, locale } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return {}
  const car = await getShowroomCar(agency.id, carId)
  if (!car) return {}

  const name = carName(car, locale)
  return {
    title: name,
    description:
      (locale === "en" ? car.descriptionEn : car.descriptionAr)?.slice(0, 160) ??
      undefined,
    openGraph: {
      title: name,
      images: car.images[0] ? [imageUrl(car.images[0].path, "full")] : undefined,
    },
  }
}

export default async function CarPage({ params }: Props) {
  const { locale, slug, carId } = await params
  setRequestLocale(locale)

  const agency = await getAgencyBySlug(slug)
  if (!agency || agency.suspended) notFound()
  if (locale === "en" && !agency.locales.includes("en")) {
    redirect(`/${slug}/cars/${carId}`)
  }

  const car = await getShowroomCar(agency.id, carId)
  if (!car) notFound()

  const t = await getTranslations("Showroom")
  const tc = await getTranslations("Common")
  const tCar = await getTranslations("Cars")
  const tCity = await getTranslations("Cities")
  const tBody = await getTranslations("BodyTypes")

  const name = carName(car, locale)
  const description = locale === "en" ? car.descriptionEn : car.descriptionAr
  const rate = primaryRate(car)
  const isClosed = car.status === "SOLD" || car.status === "RENTED_OUT"
  const BackIcon = isRtl(locale) ? ArrowRight : ArrowLeft

  const whatsappLink = agency.links.find((l) => l.platform === "WHATSAPP")
  const phoneLink = agency.links.find((l) => l.platform === "PHONE")

  const specs = [
    car.year && { label: tCar("year"), value: String(car.year) },
    car.mileage != null && {
      label: tCar("mileage"),
      value: formatPrice(car.mileage, locale)!,
    },
    car.gear && { label: tCar("gear"), value: tCar(car.gear) },
    car.fuel && { label: tCar("fuel"), value: tCar(car.fuel) },
    car.condition && { label: tCar("condition"), value: tCar(car.condition) },
    car.bodyType && { label: tCar("bodyType"), value: tBody(car.bodyType) },
    car.city && { label: tCar("city"), value: tCity(car.city as "RIYADH") },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <AccentTheme color={agency.accentColor} />
      <ViewTracker agencyId={agency.id} carId={car.id} type="CAR_VIEW" />
      <ShowroomHeader agency={agency} locale={locale} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Link
          href={`/${slug}`}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 transition-colors"
        >
          <BackIcon className="size-4" />
          {t("backToShowroom")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <CarGallery images={car.images} alt={name} />

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {car.listingType === "SALE" ? t("carsForSale") : t("carsForRent")}
                </Badge>
                {isClosed && (
                  <Badge variant="secondary">
                    {car.status === "SOLD" ? t("soldBadge") : t("rentedBadge")}
                  </Badge>
                )}
              </div>

              <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {name}
              </h1>

              <div className="mt-3">
                {car.listingType === "SALE" ? (
                  car.price != null ? (
                    <p className="text-3xl font-semibold">
                      {formatPrice(car.price, locale)}{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        {tc("currency")}
                      </span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">{t("priceOnRequest")}</p>
                  )
                ) : rate ? (
                  <div className="space-y-1">
                    <p className="text-3xl font-semibold">
                      {formatPrice(rate.value, locale)}{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        {tc("currency")} {tc(rate.period)}
                      </span>
                    </p>
                    {/* Every tier the agency actually offers, not just the headline one. */}
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 text-sm">
                      {car.rateWeekly != null && rate.period !== "perWeek" && (
                        <span>
                          {formatPrice(car.rateWeekly, locale)} {tc("perWeek")}
                        </span>
                      )}
                      {car.rateMonthly != null && rate.period !== "perMonth" && (
                        <span>
                          {formatPrice(car.rateMonthly, locale)} {tc("perMonth")}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("priceOnRequest")}</p>
                )}
              </div>
            </div>

            {!isClosed && (
              <ContactCta
                agencyId={agency.id}
                carId={car.id}
                whatsapp={
                  whatsappLink ? whatsappUrl(whatsappLink.value) : undefined
                }
                phone={phoneLink?.value}
                message={t("whatsappMessage", {
                  car: name,
                  url: carUrl(slug, car.id, locale === "en" ? "en" : "ar"),
                })}
              />
            )}

            {specs.length > 0 && (
              <div>
                <h2 className="mb-3 text-base font-medium">{t("specs")}</h2>
                <dl className="border-border/60 divide-border/60 divide-y rounded-lg border">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <dt className="text-muted-foreground">{spec.label}</dt>
                      <dd className="font-medium">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {description && (
          <div className="mt-10 max-w-3xl">
            <h2 className="mb-2 text-base font-medium">{t("description")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        )}
      </main>
    </>
  )
}
