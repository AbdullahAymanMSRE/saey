/**
 * Values shared between the database enums, the forms, and the message files.
 * Enum *codes* are stored; their Arabic and English labels come from
 * `messages/*.json`, which is what makes a car card render correctly in either
 * language no matter which language the agency works in.
 */

export const LISTING_TYPES = ["SALE", "RENT"] as const
export const CAR_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "SOLD",
  "RENTED_OUT",
] as const
export const FUELS = ["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC"] as const
export const GEARS = ["AUTO", "MANUAL"] as const
export const CONDITIONS = ["NEW", "USED"] as const

/** Adopted from Haraj's own bilingual body-type map so imports line up 1:1. */
export const BODY_TYPES = [
  "SUV",
  "SEDAN",
  "SEDAN_SMALL",
  "SEDAN_LUX",
  "JEEP",
  "JEEP_LUX",
  "COUPE",
  "HATCHBACK",
  "VAN",
  "PICKUP_SMALL",
  "PICKUP_LARGE",
  "ANTIQUE",
] as const

/** Haraj's Arabic body-type strings → our codes, for the importer. */
export const HARAJ_BODY_TYPE_MAP: Record<string, (typeof BODY_TYPES)[number]> = {
  "اس يو في": "SUV",
  سيدان: "SEDAN",
  "سيدان صغيرة": "SEDAN_SMALL",
  "سيدان فاخرة": "SEDAN_LUX",
  جيوب: "JEEP",
  "جيوب فاخرة": "JEEP_LUX",
  كوبيه: "COUPE",
  هاتشباك: "HATCHBACK",
  فان: "VAN",
  "بيك أب صغير": "PICKUP_SMALL",
  "بيك أب كبير": "PICKUP_LARGE",
  تراثية: "ANTIQUE",
}

export const LINK_PLATFORMS = [
  "WHATSAPP",
  "PHONE",
  "SNAPCHAT",
  "INSTAGRAM",
  "TIKTOK",
  "X",
  "WEBSITE",
  "MAPS",
] as const

export type LinkPlatform = (typeof LINK_PLATFORMS)[number]

/** Platforms whose value is a phone number rather than a URL or handle. */
export const PHONE_PLATFORMS: LinkPlatform[] = ["WHATSAPP", "PHONE"]

export const CITIES = [
  "RIYADH",
  "JEDDAH",
  "MAKKAH",
  "MADINAH",
  "DAMMAM",
  "KHOBAR",
  "DHAHRAN",
  "TAIF",
  "BURAYDAH",
  "TABUK",
  "HAIL",
  "ABHA",
  "KHAMIS_MUSHAIT",
  "NAJRAN",
  "JAZAN",
  "YANBU",
  "JUBAIL",
  "AL_AHSA",
  "ARAR",
  "SAKAKA",
  "QATIF",
  "OTHER",
] as const

/** Haraj's Arabic city names → our codes. Kept loose; unknown cities fall through. */
export const HARAJ_CITY_MAP: Record<string, (typeof CITIES)[number]> = {
  الرياض: "RIYADH",
  جدة: "JEDDAH",
  جده: "JEDDAH",
  مكة: "MAKKAH",
  مكه: "MAKKAH",
  المدينة: "MADINAH",
  "المدينة المنورة": "MADINAH",
  الدمام: "DAMMAM",
  الخبر: "KHOBAR",
  الظهران: "DHAHRAN",
  الطائف: "TAIF",
  بريدة: "BURAYDAH",
  تبوك: "TABUK",
  حائل: "HAIL",
  أبها: "ABHA",
  ابها: "ABHA",
  "خميس مشيط": "KHAMIS_MUSHAIT",
  نجران: "NAJRAN",
  جازان: "JAZAN",
  ينبع: "YANBU",
  الجبيل: "JUBAIL",
  الأحساء: "AL_AHSA",
  الاحساء: "AL_AHSA",
  عرعر: "ARAR",
  سكاكا: "SAKAKA",
  القطيف: "QATIF",
}

/**
 * Agency slugs live at the URL root. Our own routes are namespaced under
 * `/app/*` so collision is structurally impossible, but these must still be
 * refused because they are reachable at the root regardless of routing.
 */
export const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "en",
  "ar",
  "_next",
  "_vercel",
  "static",
  "assets",
  "public",
  "images",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "opensearch.xml",
  "well-known",
])

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/

/** Repeat views from the same visitor inside this window are not re-counted. */
export const VIEW_DEDUPE_MINUTES = 30

export const MAX_IMAGES_PER_CAR = 20
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Widths written on upload. Originals are stored but never served. */
export const IMAGE_SIZES = { thumb: 400, card: 800, full: 1600 } as const
export type ImageSize = keyof typeof IMAGE_SIZES
