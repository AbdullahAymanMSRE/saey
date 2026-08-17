import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { carName, formatPrice, primaryRate } from "@/lib/format"
import { imageUrl } from "@/lib/image-url"
import type { ShowroomCar } from "@/lib/showroom"
import { cn } from "@/lib/utils"

export function CarCard({
  car,
  slug,
  locale,
}: {
  car: ShowroomCar
  slug: string
  locale: string
}) {
  const t = useTranslations("Showroom")
  const tc = useTranslations("Common")

  const cover = car.images[0]
  const name = carName(car, locale)
  const rate = primaryRate(car)
  // A completed deal is still worth showing, it is the agency's track record ,
  // but it reads as history, not as something to enquire about.
  const isClosed = car.status === "SOLD" || car.status === "RENTED_OUT"

  return (
    <Link
      href={`/${slug}/cars/${car.id}`}
      className={cn(
        "group border-border/60 bg-card focus-visible:ring-ring/60 relative flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none",
        isClosed && "opacity-75",
      )}
    >
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl(cover.path, "card")}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {tc("none")}
          </div>
        )}

        {isClosed && (
          <Badge
            variant="secondary"
            className="absolute top-3 start-3 shadow-sm backdrop-blur"
          >
            {car.status === "SOLD" ? t("soldBadge") : t("rentedBadge")}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-medium">{name}</h3>

        <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {car.year && <span>{car.year}</span>}
          {car.mileage != null && (
            <span>{formatPrice(car.mileage, locale)} km</span>
          )}
        </div>

        <div className="mt-auto pt-2">
          {car.listingType === "SALE" ? (
            car.price != null ? (
              <p className="text-lg font-semibold">
                {formatPrice(car.price, locale)}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  {tc("currency")}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("priceOnRequest")}
              </p>
            )
          ) : rate ? (
            <p className="text-lg font-semibold">
              {formatPrice(rate.value, locale)}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                {tc("currency")} {tc(rate.period)}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground">{t("priceOnRequest")}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
