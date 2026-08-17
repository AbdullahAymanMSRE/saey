import { defineRouting } from "next-intl/routing"

export const locales = ["ar", "en"] as const
export type AppLocale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: "ar",
  // Arabic is unprefixed (`/riyadh-motors`), English is prefixed
  // (`/en/riyadh-motors`). Agency slugs therefore sit at the URL root, which is
  // why every route of ours is namespaced under `/app/*`.
  localePrefix: "as-needed",
  // Off deliberately. With detection on, a phone set to English lands on /en
  // even for a Saudi audience, and a QR code printed for `/riyadh-motors` would
  // bounce through /en before redirecting back. Arabic is the default because
  // this is the Saudi market; English is an explicit choice via the switcher.
  localeDetection: false,
})

export const localeDirection: Record<AppLocale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
}

export const localeNames: Record<AppLocale, string> = {
  ar: "العربية",
  en: "English",
}
