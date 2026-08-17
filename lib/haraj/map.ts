import { CITIES, CONDITIONS, FUELS, GEARS, HARAJ_CITY_MAP } from "@/lib/constants"

import type { HarajPost } from "./types"

/**
 * Maps a Haraj post onto the subset of our car fields that Haraj actually
 * carries. Everything else, make, model, English text, rental rates, is left
 * empty on purpose for the agency to fill.
 *
 * Notably NOT parsed: make and model. Haraj keeps them only inside free-form
 * tags like `["كامري,GLI","كامري 2027","تويوتا"]`, and guessing from that would
 * put wrong data on a public page under the appearance of certainty.
 */

const asEnum = <T extends readonly string[]>(
  list: T,
  raw: string | null | undefined,
): T[number] | null => {
  if (!raw) return null
  const up = raw.toUpperCase()
  return (list as readonly string[]).includes(up) ? (up as T[number]) : null
}

export function isCarPost(post: HarajPost) {
  return post.carInfo?.carOrRelated === "CAR"
}

export function mapPost(post: HarajPost) {
  const info = post.carInfo

  const priceRaw = post.price?.inputPrice ?? null
  const parsedPrice = priceRaw == null ? null : Number(priceRaw)
  // Haraj routinely carries "0" for "call me". Zero is not a price, and showing
  // a car at SAR 0 would be worse than showing no price at all.
  const price =
    Number.isFinite(parsedPrice) && parsedPrice && parsedPrice > 0
      ? Math.round(parsedPrice as number)
      : null

  const city = post.city ? (HARAJ_CITY_MAP[post.city.trim()] ?? null) : null

  return {
    // `carInfo.model` is the model YEAR despite the name. Verified against live
    // data, and observed disagreeing with the post's own title, which is why
    // imports land as drafts for review rather than publishing themselves.
    year: info?.model && info.model > 1950 ? info.model : null,
    mileage: info?.mileage && info.mileage > 0 ? info.mileage : null,
    fuel: asEnum(FUELS, info?.fuel),
    gear: asEnum(GEARS, info?.gear),
    condition: asEnum(CONDITIONS, info?.condition),
    city: city && (CITIES as readonly string[]).includes(city) ? city : null,
    price,
    titleAr: post.title?.trim() || null,
    descriptionAr: post.bodyTEXT?.trim() || null,
    harajPostId: Number(post.id),
    harajUrl: post.URL ?? `https://haraj.com.sa/${post.id}`,
    images: (post.imagesList ?? []).filter(
      (u) => typeof u === "string" && /^https?:\/\//.test(u),
    ),
  }
}

export type MappedPost = ReturnType<typeof mapPost>

/**
 * What changed upstream since we imported. Deliberately narrow: only the two
 * fields an agency would want to know about, and only ever surfaced as a notice
 * to accept, never written over their edits.
 */
export function diffAgainst(
  existing: { price: number | null; status: string },
  mapped: MappedPost,
  postActive: boolean,
) {
  const diff: Record<string, unknown> = {}
  if (mapped.price != null && existing.price !== mapped.price) {
    diff.price = { from: existing.price, to: mapped.price }
  }
  if (!postActive) diff.harajInactive = true
  return Object.keys(diff).length ? diff : null
}
