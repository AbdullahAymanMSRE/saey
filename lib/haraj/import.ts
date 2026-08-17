import { and, eq, inArray, isNotNull, lt, notInArray } from "drizzle-orm"

import { db } from "@/db"
import { carImages, cars, importRuns } from "@/db/schema"
import { newId } from "@/lib/ids"
import { storeImage } from "@/lib/storage"

import { fetchAllPosts } from "./client"
import { diffAgainst, isCarPost, mapPost } from "./map"

/** A run whose heartbeat stopped this long ago was killed by a redeploy. */
const STALE_AFTER_MS = 5 * 60_000

export async function reapStaleRuns() {
  await db
    .update(importRuns)
    .set({
      status: "FAILED",
      error: "The import stopped unexpectedly, most likely a server restart.",
      finishedAt: new Date(),
    })
    .where(
      and(
        eq(importRuns.status, "RUNNING"),
        lt(importRuns.heartbeatAt, new Date(Date.now() - STALE_AFTER_MS)),
      ),
    )
}

export async function activeRun(agencyId: string) {
  await reapStaleRuns()
  return db.query.importRuns.findFirst({
    where: and(
      eq(importRuns.agencyId, agencyId),
      eq(importRuns.status, "RUNNING"),
    ),
  })
}

async function mirrorImages(urls: string[], agencyId: string, carId: string) {
  // Re-hosted rather than hotlinked: Haraj ads expire routinely, and a showroom
  // that decays into broken images is worse than one that took longer to import.
  let sort = 0
  for (const url of urls.slice(0, 12)) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        headers: { "user-agent": "Saey/1.0", referer: "https://haraj.com.sa/" },
      })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      const stored = await storeImage(buf, `cars/${agencyId}`)
      await db.insert(carImages).values({
        id: newId(),
        carId,
        path: stored.path,
        width: stored.width,
        height: stored.height,
        sort: sort++,
      })
    } catch {
      // One unreachable photo must not abandon the whole import.
    }
  }
}

/**
 * Runs in-process. The dashboard follows along by polling the `import_runs` row,
 * which is also what makes a run killed mid-flight recoverable: the heartbeat
 * goes stale, the run is reaped as FAILED, and re-running is safe because every
 * write is keyed on (agencyId, harajPostId).
 */
export async function runImport(opts: {
  runId: string
  agencyId: string
  username: string
}) {
  const { runId, agencyId, username } = opts
  const log: string[] = []
  let imported = 0
  let skipped = 0
  let changed = 0

  const beat = setInterval(() => {
    void db
      .update(importRuns)
      .set({ heartbeatAt: new Date() })
      .where(eq(importRuns.id, runId))
      .catch(() => {})
  }, 15_000)

  try {
    const { posts, pages, stopReason } = await fetchAllPosts(
      username,
      async (pageCount, fetched) => {
        await db
          .update(importRuns)
          .set({ pages: pageCount, fetched, heartbeatAt: new Date() })
          .where(eq(importRuns.id, runId))
      },
    )

    const carPosts = posts.filter(isCarPost)
    log.push(
      `Fetched ${posts.length} ads over ${pages} page(s); ${carPosts.length} are cars.`,
    )
    if (stopReason === "CEILING") {
      log.push(
        `Stopped at the ${posts.length}-listing safety ceiling, this sync is not complete.`,
      )
    }

    const seenPostIds = carPosts.map((p) => Number(p.id))
    const existing = seenPostIds.length
      ? await db
          .select({
            id: cars.id,
            harajPostId: cars.harajPostId,
            price: cars.price,
            status: cars.status,
          })
          .from(cars)
          .where(
            and(
              eq(cars.agencyId, agencyId),
              inArray(cars.harajPostId, seenPostIds),
            ),
          )
      : []

    const byPostId = new Map(existing.map((c) => [c.harajPostId, c]))

    for (const post of carPosts) {
      const mapped = mapPost(post)
      const prior = byPostId.get(mapped.harajPostId)

      if (prior) {
        // Never overwrite: by now the agency has picked a make and model and
        // possibly written English text. Differences are surfaced, not applied.
        const diff = diffAgainst(
          { price: prior.price, status: prior.status },
          mapped,
          post.status !== false,
        )
        await db
          .update(cars)
          .set({
            harajDiff: diff,
            harajMissing: false,
            harajSyncedAt: new Date(),
          })
          .where(eq(cars.id, prior.id))
        if (diff) changed++
        else skipped++
        continue
      }

      const carId = newId()
      await db.insert(cars).values({
        id: carId,
        agencyId,
        // Haraj has no rental concept at all, `sellOrWaiver` is sell vs waiver
        // (تنازل). SALE is what the source actually says; an agency renting the
        // car flips it during review.
        listingType: "SALE",
        status: "DRAFT",
        source: "HARAJ",
        year: mapped.year,
        mileage: mapped.mileage,
        fuel: mapped.fuel,
        gear: mapped.gear,
        condition: mapped.condition,
        city: mapped.city,
        price: mapped.price,
        titleAr: mapped.titleAr,
        descriptionAr: mapped.descriptionAr,
        harajPostId: mapped.harajPostId,
        harajUrl: mapped.harajUrl,
        harajSyncedAt: new Date(),
      })

      await mirrorImages(mapped.images, agencyId, carId)
      imported++

      await db
        .update(importRuns)
        .set({ imported, skipped, changed, heartbeatAt: new Date() })
        .where(eq(importRuns.id, runId))
    }

    // Ads that vanished are flagged only. Haraj ads expire as a matter of
    // course, so auto-unpublishing would quietly empty a working showroom.
    const flagged = await db
      .update(cars)
      .set({ harajMissing: true })
      .where(
        and(
          eq(cars.agencyId, agencyId),
          eq(cars.source, "HARAJ"),
          isNotNull(cars.harajPostId),
          ...(seenPostIds.length
            ? [notInArray(cars.harajPostId, seenPostIds)]
            : []),
        ),
      )
      .returning({ id: cars.id })

    if (flagged.length) {
      log.push(`${flagged.length} previously imported ad(s) are no longer on Haraj.`)
    }

    await db
      .update(importRuns)
      .set({
        status: "COMPLETED",
        imported,
        skipped,
        changed,
        pages,
        fetched: posts.length,
        stopReason,
        logs: log,
        finishedAt: new Date(),
      })
      .where(eq(importRuns.id, runId))
  } catch (err) {
    await db
      .update(importRuns)
      .set({
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
        logs: log,
        finishedAt: new Date(),
      })
      .where(eq(importRuns.id, runId))
  } finally {
    clearInterval(beat)
  }
}
