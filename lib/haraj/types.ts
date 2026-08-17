/**
 * Hand-written against observed responses.
 *
 * Haraj disables GraphQL introspection, `__schema` returns HTTP 200 with a
 * zero-byte body, so there is no schema to generate from. Every field here was
 * confirmed against live data; treat anything absent as genuinely absent rather
 * than merely undocumented.
 */

export type HarajCarInfo = {
  sellOrWaiver: "SELL" | "WAIVER" | null
  is4DW: boolean | null
  /** The model YEAR, not the model name. Observed disagreeing with the title. */
  model: number | null
  mileage: number | null
  fuel: string | null
  gear: string | null
  condition: string | null
  carOrRelated: "CAR" | string | null
  Bank: string | null
}

export type HarajPost = {
  id: number
  title: string | null
  bodyTEXT: string | null
  postDate: string | null
  updateDate: string | null
  authorUsername: string | null
  authorId: number | null
  URL: string | null
  city: string | null
  tags: string[] | null
  imagesList: string[] | null
  thumbURL: string | null
  hasImage: boolean | null
  status: boolean | null
  postType: string | null
  price: { formattedPrice: string | null; inputPrice: string | null } | null
  /** Null on every non-car post. */
  carInfo: HarajCarInfo | null
}

export type HarajPostsPage = {
  items: (HarajPost | null)[]
  /** The ONLY completeness signal Haraj gives, there is no total count. */
  pageInfo: { hasNextPage: boolean } | null
}

export type FetchStopReason = "NO_NEXT_PAGE" | "EMPTY_PAGE" | "CEILING"
