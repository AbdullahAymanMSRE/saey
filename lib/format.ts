import type { AppLocale } from "@/i18n/routing"

type Named = { nameAr: string; nameEn: string } | null | undefined

export const localeName = (item: Named, locale: string) =>
  !item ? null : locale === "ar" ? item.nameAr : item.nameEn

/**
 * The line a car is known by.
 *
 * Falls back through make/model to the agency's own title, because an imported
 * Haraj draft has a title but no catalog picks yet, while a manually added car
 * may have catalog picks and no title.
 */
export function carName(
  car: {
    titleAr?: string | null
    titleEn?: string | null
    year?: number | null
    otherMake?: string | null
    otherModel?: string | null
    make?: Named
    model?: Named
  },
  locale: string,
) {
  const make = localeName(car.make, locale) ?? car.otherMake
  const model = localeName(car.model, locale) ?? car.otherModel
  const title = locale === "ar" ? car.titleAr : (car.titleEn ?? car.titleAr)

  // The catalog name only wins when there IS one. A freshly imported Haraj draft
  // has no make or model yet, and building from year alone would label the car
  // "2027" while its perfectly good title sat unused.
  if (!make && !model) return title || (car.year ? String(car.year) : "")

  return [make, model, car.year].filter(Boolean).join(" ")
}

/**
 * `-u-nu-latn` is doing real work here.
 *
 * Plain "ar-SA" formats with Arabic-Indic digits (١٢٬٠٠٠), which is correct
 * Arabic typography but not what this product wants: prices, years and mileage
 * are read as Western numerals across the Saudi car market, and on Haraj itself.
 */
const numberLocale = (locale: string) =>
  locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"

export function formatPrice(value: number | null | undefined, locale: string) {
  if (value == null) return null
  return new Intl.NumberFormat(numberLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(numberLocale(locale)).format(value)
}

/** The rate a rental card leads with, daily if offered, else the cheapest tier. */
export function primaryRate(car: {
  rateDaily?: number | null
  rateWeekly?: number | null
  rateMonthly?: number | null
}) {
  if (car.rateDaily != null) return { value: car.rateDaily, period: "perDay" as const }
  if (car.rateWeekly != null) return { value: car.rateWeekly, period: "perWeek" as const }
  if (car.rateMonthly != null)
    return { value: car.rateMonthly, period: "perMonth" as const }
  return null
}

export const isRtl = (locale: string) => locale === "ar"

export function dir(locale: string): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr"
}

export type { AppLocale }
