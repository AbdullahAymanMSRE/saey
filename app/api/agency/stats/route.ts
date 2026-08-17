import { and, count, eq, isNotNull, ne } from "drizzle-orm"

import { db } from "@/db"
import { cars } from "@/db/schema"
import { agencyStats } from "@/lib/analytics"
import { requireAgency, route } from "@/lib/session"
import { missingForPublish } from "@/lib/validation"

export async function GET(req: Request) {
  return route(async () => {
    const { agency } = await requireAgency()
    const days = Number(new URL(req.url).searchParams.get("days") ?? 30)

    const [stats, counts, drafts, changed] = await Promise.all([
      agencyStats(agency.id, Number.isFinite(days) ? days : 30),
      db
        .select({ status: cars.status, value: count() })
        .from(cars)
        .where(eq(cars.agencyId, agency.id))
        .groupBy(cars.status),
      db.select().from(cars).where(
        and(eq(cars.agencyId, agency.id), eq(cars.status, "DRAFT")),
      ),
      db
        .select({ value: count() })
        .from(cars)
        .where(
          and(
            eq(cars.agencyId, agency.id),
            isNotNull(cars.harajDiff),
            ne(cars.status, "DRAFT"),
          ),
        ),
    ])

    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.value]))

    return Response.json({
      ...stats,
      counts: {
        published: byStatus.PUBLISHED ?? 0,
        draft: byStatus.DRAFT ?? 0,
        sold: byStatus.SOLD ?? 0,
        rentedOut: byStatus.RENTED_OUT ?? 0,
      },
      // How many drafts are blocked purely on an English translation, the
      // number an agency wants when it imported 40 Arabic-only ads.
      needingTranslation: agency.locales.includes("en")
        ? drafts.filter((car) => {
            const missing = missingForPublish(car, agency)
            return (
              missing.length > 0 &&
              missing.every((m) => m === "titleEn" || m === "descriptionEn")
            )
          }).length
        : 0,
      harajChanges: changed[0]?.value ?? 0,
    })
  })
}
