import { RESERVED_SLUGS, SLUG_PATTERN } from "./constants"

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  )
}

/** Arabic is unprefixed; English is not. Baked into every QR code. */
export function showroomUrl(slug: string, locale: "ar" | "en" = "ar") {
  return locale === "ar"
    ? `${appUrl()}/${slug}`
    : `${appUrl()}/${locale}/${slug}`
}

export function carUrl(slug: string, carId: string, locale: "ar" | "en" = "ar") {
  return `${showroomUrl(slug, locale)}/cars/${carId}`
}

export type SlugProblem = "format" | "reserved" | null

export function validateSlug(slug: string): SlugProblem {
  if (!SLUG_PATTERN.test(slug)) return "format"
  if (RESERVED_SLUGS.has(slug)) return "reserved"
  return null
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

/**
 * Saudi numbers arrive as 05…, 5…, +9665… or 009665…; wa.me needs bare E.164
 * digits. Anything unrecognisable is returned digits-only rather than thrown
 * away, so a foreign number still produces a usable link.
 */
export function toE164(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("00")) return digits.slice(2)
  if (digits.startsWith("966")) return digits
  if (digits.startsWith("0")) return `966${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`
  return digits
}

export function whatsappUrl(phone: string, message?: string) {
  const base = `https://wa.me/${toE164(phone)}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
