import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Saudi timezone, so "3 days ago" on a dashboard means what an agency in
    // Riyadh expects it to mean.
    timeZone: "Asia/Riyadh",
    formats: {
      number: {
        currency: {
          style: "currency",
          currency: "SAR",
          maximumFractionDigits: 0,
          numberingSystem: "latn",
        },
        /**
         * Referenced as `{count, number, latn}` inside Arabic plurals, because
         * a bare ICU `#` formats with the locale's default numbering system and
         * "ar" means Arabic-Indic digits (٣ rather than 3). The Saudi car market
         * reads Western numerals, so counts and prices use them throughout.
         */
        latn: { numberingSystem: "latn", maximumFractionDigits: 0 },
      },
    },
  }
})
