import { createHash } from "node:crypto"

import { and, count, countDistinct, desc, eq, gte, sql } from "drizzle-orm"

import { db } from "@/db"
import { cars, viewEvents } from "@/db/schema"

import { VIEW_DEDUPE_MINUTES } from "./constants"
import { newId } from "./ids"

/**
 * A visitor is `sha256(ip + userAgent + dailySalt)`.
 *
 * No cookie is set, which is why the showroom needs no consent banner, and
 * because the salt rotates daily the same person is a different hash tomorrow.
 * That is a real limitation, not an oversight, it is exactly why the dashboard
 * labels this an *estimated* visitor count.
 */
export function visitorHash(ip: string, userAgent: string) {
  const day = new Date().toISOString().slice(0, 10)
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${day}|${process.env.ANALYTICS_SALT ?? ""}`)
    .digest("hex")
}

export function clientIp(headers: Headers) {
  // Railway terminates TLS at its edge and forwards the real address here.
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()
  return headers.get("x-real-ip") ?? "0.0.0.0"
}

const BOT_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|whatsapp|telegram|preview|monitor|curl|wget|python-requests|headless/i

export function isBot(userAgent: string) {
  return BOT_PATTERN.test(userAgent)
}

type TrackInput = {
  agencyId: string
  carId?: string | null
  type: "SHOWROOM_VIEW" | "CAR_VIEW" | "CONTACT_CLICK"
  ip: string
  userAgent: string
}

/**
 * Records a view unless the same visitor already produced the same event within
 * the dedupe window. Bots are dropped outright so an agency's "most viewed" list
 * reflects buyers rather than crawlers.
 */
export async function track({
  agencyId,
  carId,
  type,
  ip,
  userAgent,
}: TrackInput) {
  if (isBot(userAgent)) return { counted: false as const }

  const hash = visitorHash(ip, userAgent)
  const since = new Date(Date.now() - VIEW_DEDUPE_MINUTES * 60_000)

  const [existing] = await db
    .select({ id: viewEvents.id })
    .from(viewEvents)
    .where(
      and(
        eq(viewEvents.visitorHash, hash),
        eq(viewEvents.type, type),
        carId ? eq(viewEvents.carId, carId) : eq(viewEvents.agencyId, agencyId),
        gte(viewEvents.createdAt, since),
      ),
    )
    .limit(1)

  if (existing) return { counted: false as const }

  await db.insert(viewEvents).values({
    id: newId(),
    agencyId,
    carId: carId ?? null,
    type,
    visitorHash: hash,
  })

  // A denormalised counter on the car, so ordering a showroom by popularity
  // never has to aggregate the events table.
  if (type === "CAR_VIEW" && carId) {
    await db
      .update(cars)
      .set({ viewCount: sql`${cars.viewCount} + 1` })
      .where(eq(cars.id, carId))
  }

  return { counted: true as const }
}

export async function agencyStats(agencyId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000)
  const scope = and(
    eq(viewEvents.agencyId, agencyId),
    gte(viewEvents.createdAt, since),
  )

  const [[visitors], [showroomViews], [carViews], [contacts]] =
    await Promise.all([
      db
        .select({ value: countDistinct(viewEvents.visitorHash) })
        .from(viewEvents)
        .where(scope),
      db
        .select({ value: count() })
        .from(viewEvents)
        .where(and(scope, eq(viewEvents.type, "SHOWROOM_VIEW"))),
      db
        .select({ value: count() })
        .from(viewEvents)
        .where(and(scope, eq(viewEvents.type, "CAR_VIEW"))),
      db
        .select({ value: count() })
        .from(viewEvents)
        .where(and(scope, eq(viewEvents.type, "CONTACT_CLICK"))),
    ])

  const topCars = await db
    .select({
      carId: viewEvents.carId,
      views: count(),
      titleAr: cars.titleAr,
      titleEn: cars.titleEn,
      status: cars.status,
    })
    .from(viewEvents)
    .innerJoin(cars, eq(cars.id, viewEvents.carId))
    .where(and(scope, eq(viewEvents.type, "CAR_VIEW")))
    .groupBy(viewEvents.carId, cars.titleAr, cars.titleEn, cars.status)
    .orderBy(desc(count()))
    .limit(8)

  const daily = await db
    .select({
      day: sql<string>`to_char(${viewEvents.createdAt}, 'YYYY-MM-DD')`,
      visitors: countDistinct(viewEvents.visitorHash),
      views: count(),
    })
    .from(viewEvents)
    .where(scope)
    .groupBy(sql`1`)
    .orderBy(sql`1`)

  return {
    days,
    visitors: visitors?.value ?? 0,
    showroomViews: showroomViews?.value ?? 0,
    carViews: carViews?.value ?? 0,
    contactClicks: contacts?.value ?? 0,
    topCars,
    daily,
  }
}
