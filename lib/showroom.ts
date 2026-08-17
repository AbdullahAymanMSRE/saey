import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { agencies, agencyLinks, carMakes, cars } from "@/db/schema"

export type ShowroomFilters = {
  type?: "SALE" | "RENT"
  make?: string
  year?: number
  gear?: "AUTO" | "MANUAL"
  condition?: "NEW" | "USED"
  city?: string
  q?: string
  min?: number
  max?: number
  sort?: "newest" | "priceAsc" | "priceDesc"
}

export async function getAgencyBySlug(slug: string) {
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, slug),
  })
  if (!agency) return null

  const links = await db
    .select()
    .from(agencyLinks)
    .where(eq(agencyLinks.agencyId, agency.id))
    .orderBy(asc(agencyLinks.sort))

  return { ...agency, links }
}

/**
 * Everything a visitor may see.
 *
 * Sold and rented-out cars are included deliberately, an agency's completed
 * deals are the social proof the showroom exists to show, but they sort below
 * available stock so the page still leads with what someone can actually buy.
 */
export async function getShowroomCars(
  agencyId: string,
  filters: ShowroomFilters = {},
) {
  const conditions = [
    eq(cars.agencyId, agencyId),
    eq(cars.isHidden, false),
    ne(cars.status, "DRAFT"),
  ]

  if (filters.type) conditions.push(eq(cars.listingType, filters.type))
  if (filters.make) conditions.push(eq(cars.makeId, filters.make))
  if (filters.year) conditions.push(eq(cars.year, filters.year))
  if (filters.gear) conditions.push(eq(cars.gear, filters.gear))
  if (filters.condition) conditions.push(eq(cars.condition, filters.condition))
  if (filters.city) conditions.push(eq(cars.city, filters.city))

  // Price filtering spans two different columns depending on listing type, so
  // it compares against whichever one this car actually uses.
  const priceExpr = sql<number>`coalesce(${cars.price}, ${cars.rateDaily}, ${cars.rateMonthly})`
  if (filters.min != null) conditions.push(gte(priceExpr, filters.min))
  if (filters.max != null) conditions.push(lte(priceExpr, filters.max))

  if (filters.q) {
    const term = `%${filters.q}%`
    conditions.push(
      or(
        ilike(cars.titleAr, term),
        ilike(cars.titleEn, term),
        ilike(cars.descriptionAr, term),
        ilike(cars.descriptionEn, term),
        ilike(cars.otherMake, term),
        ilike(cars.otherModel, term),
      )!,
    )
  }

  const order =
    filters.sort === "priceAsc"
      ? [asc(priceExpr)]
      : filters.sort === "priceDesc"
        ? [desc(priceExpr)]
        : [desc(cars.createdAt)]

  const rows = await db.query.cars.findMany({
    where: and(...conditions),
    with: {
      images: { orderBy: (i, { asc: A }) => [A(i.sort)] },
      make: true,
      model: true,
    },
    // Available first, completed deals after, see the note above.
    orderBy: [
      sql`case when ${cars.status} = 'PUBLISHED' then 0 else 1 end`,
      ...order,
    ],
    limit: 300,
  })

  return rows
}

export async function getShowroomCar(agencyId: string, carId: string) {
  const car = await db.query.cars.findFirst({
    where: and(
      eq(cars.id, carId),
      eq(cars.agencyId, agencyId),
      eq(cars.isHidden, false),
      ne(cars.status, "DRAFT"),
    ),
    with: {
      images: { orderBy: (i, { asc: A }) => [A(i.sort)] },
      make: true,
      model: true,
    },
  })
  return car ?? null
}

/** Only the makes this agency actually lists, an empty filter option is noise. */
export async function getShowroomFacets(agencyId: string) {
  const rows = await db
    .selectDistinct({ makeId: cars.makeId, year: cars.year, city: cars.city })
    .from(cars)
    .where(
      and(
        eq(cars.agencyId, agencyId),
        eq(cars.isHidden, false),
        ne(cars.status, "DRAFT"),
      ),
    )

  const makeIds = [...new Set(rows.map((r) => r.makeId).filter(Boolean))] as string[]
  const makes = makeIds.length
    ? await db.select().from(carMakes).where(inArray(carMakes.id, makeIds))
    : []

  return {
    makes: makes.sort((a, b) => a.sort - b.sort),
    years: [...new Set(rows.map((r) => r.year).filter(Boolean))].sort(
      (a, b) => (b as number) - (a as number),
    ) as number[],
    cities: [...new Set(rows.map((r) => r.city).filter(Boolean))] as string[],
  }
}

export type ShowroomCar = Awaited<ReturnType<typeof getShowroomCars>>[number]
export type ShowroomAgency = NonNullable<Awaited<ReturnType<typeof getAgencyBySlug>>>
