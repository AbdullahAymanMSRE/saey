import type { FetchStopReason, HarajPost, HarajPostsPage } from "./types"

const API_ORIGIN = process.env.HARAJ_GRAPHQL_URL || "https://graphql.haraj.com.sa"

const TIMEOUT_MS = 15_000

/** Haraj's own client asks for 30; 50 is within what the server accepts. */
const PAGE_SIZE = 50

/**
 * A runaway guard, NOT a product limit. It stops a portal that keeps answering
 * `hasNextPage: true` from looping forever, and a run that hits it records
 * CEILING so a truncated sync stays visible instead of passing for a complete one.
 */
export const MAX_SYNC_LISTINGS = 3_000

/** Never look like a burst to Haraj when paginating a 400-ad advertiser. */
const PAGE_PAUSE_MS = 300

/**
 * ── `queryName` IS MANDATORY AND FAILS SILENTLY WHEN OMITTED ────────────────
 *
 * Haraj routes on `?queryName=<root field>`. Without it the server answers
 * **HTTP 388 with a zero-byte body**, a non-standard status carrying no error
 * message, which surfaces as "empty response" and reads like a network fault
 * rather than a contract violation. The same 388 is what introspection gets.
 */
const QUERY_NAME_POSTS = "posts"

/**
 * Lifted from Haraj's `useFetchAdsQuery` bundle and REDUCED to the fields this
 * importer maps. Reduced deliberately: their full fragment pulls comment
 * threads, like counts and ranking scores, and every field we don't ask for is
 * one whose disappearance can't break us.
 */
const FETCH_ADS = `
  query FetchAds($authorUsername: String, $id: [Int], $page: Int, $limit: Int) {
    posts(authorUsername: $authorUsername, id: $id, page: $page, limit: $limit) {
      items {
        id
        title
        bodyTEXT
        postDate
        updateDate
        authorUsername
        authorId
        URL
        city
        tags
        imagesList
        thumbURL
        hasImage
        status
        postType
        price { formattedPrice inputPrice }
        carInfo {
          sellOrWaiver
          is4DW
          model
          mileage
          fuel
          gear
          condition
          carOrRelated
          Bank
        }
      }
      pageInfo { hasNextPage }
    }
  }
`

async function graphql<T>(
  queryName: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const url = `${API_ORIGIN}/?queryName=${encodeURIComponent(queryName)}`

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      // Their client sends an empty trackId on anonymous calls; sent for parity
      // with an ordinary browser request. It carries nothing.
      trackId: "",
      "accept-language": "ar",
      "user-agent": "Saey/1.0 (+showroom import for the account owner)",
    },
  })

  if (res.status >= 300 && res.status < 400) {
    throw new Error("Haraj redirected the request away; refusing to follow.")
  }

  // Named explicitly rather than folded into the generic branch, an operator
  // reading this error at 3am should not have to rediscover it the hard way.
  if (res.status === 388) {
    throw new Error(
      "Haraj refused the request (HTTP 388). Either the queryName parameter is " +
        "missing or this address is being rate-limited.",
    )
  }
  if (!res.ok) throw new Error(`Haraj returned ${res.status}`)

  const body = (await res.json().catch(() => null)) as {
    data?: T
    errors?: { message?: string }[]
  } | null

  if (!body) throw new Error("Haraj returned a response that was not JSON.")
  if (body.errors?.length) {
    throw new Error(`Haraj rejected the query: ${body.errors[0]?.message ?? "unknown"}`)
  }
  return body.data as T
}

/** One page of an advertiser's ads. `page` is zero-based, as their client uses it. */
export async function fetchPostsPage(username: string, page: number) {
  const data = await graphql<{ posts: HarajPostsPage | null }>(
    QUERY_NAME_POSTS,
    FETCH_ADS,
    { authorUsername: username, page, limit: PAGE_SIZE },
  )
  const items = (data?.posts?.items ?? []).filter((p): p is HarajPost => !!p)
  return { posts: items, hasNextPage: !!data?.posts?.pageInfo?.hasNextPage }
}

export type FetchAllResult = {
  posts: HarajPost[]
  pages: number
  stopReason: FetchStopReason
}

/**
 * Every ad an advertiser holds.
 *
 * There is no `total` to check against. Haraj's `posts` query returns
 * `hasNextPage` and nothing else, so completeness is the portal's word, which
 * is why the stop reason is recorded rather than papered over.
 */
export async function fetchAllPosts(
  username: string,
  onPage?: (pages: number, fetched: number) => void | Promise<void>,
): Promise<FetchAllResult> {
  const posts: HarajPost[] = []
  const seen = new Set<number>()
  let page = 0
  let pages = 0
  let stopReason: FetchStopReason = "NO_NEXT_PAGE"

  for (;;) {
    const { posts: batch, hasNextPage } = await fetchPostsPage(username, page)
    pages += 1

    if (!batch.length) {
      stopReason = "EMPTY_PAGE"
      break
    }

    // Deduped by id across pages rather than appended blindly: Haraj orders by
    // recency, so an advertiser posting mid-sync shifts every later page down
    // and re-serves rows we already hold.
    for (const p of batch) {
      const id = Number(p.id)
      if (!Number.isFinite(id) || seen.has(id)) continue
      seen.add(id)
      posts.push(p)
    }

    await onPage?.(pages, posts.length)

    if (!hasNextPage) break
    if (posts.length >= MAX_SYNC_LISTINGS) {
      stopReason = "CEILING"
      break
    }

    page += 1
    await new Promise((r) => setTimeout(r, PAGE_PAUSE_MS))
  }

  return { posts, pages, stopReason }
}
