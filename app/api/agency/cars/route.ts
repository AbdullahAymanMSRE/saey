import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { cars } from "@/db/schema"
import { carValues, recordCatalogRequest, syncImages } from "@/lib/cars"
import { newId } from "@/lib/ids"
import { requireAgency, route } from "@/lib/session"
import { carSchema, missingForPublish } from "@/lib/validation"

export async function GET(req: Request) {
  return route(async () => {
    const { agency } = await requireAgency()
    const params = new URL(req.url).searchParams
    const status = params.get("status")
    const listingType = params.get("listingType")

    const rows = await db.query.cars.findMany({
      where: and(
        eq(cars.agencyId, agency.id),
        status && status !== "ALL"
          ? eq(cars.status, status as "DRAFT")
          : undefined,
        listingType && listingType !== "ALL"
          ? eq(cars.listingType, listingType as "SALE")
          : undefined,
      ),
      with: {
        images: { orderBy: (i, { asc }) => [asc(i.sort)] },
        make: true,
        model: true,
      },
      orderBy:
        params.get("sort") === "views"
          ? [desc(cars.viewCount)]
          : [desc(cars.createdAt)],
      limit: 500,
    })

    return Response.json({
      cars: rows.map((car) => ({
        ...car,
        // Computed per car so the list can show exactly what each one is
        // waiting on, rather than a generic "incomplete" badge.
        missing: missingForPublish(car, agency),
      })),
    })
  })
}

export async function POST(req: Request) {
  return route(async () => {
    const { agency } = await requireAgency()
    const parsed = carSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid car", issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const id = newId()
    await db.insert(cars).values({
      id,
      agencyId: agency.id,
      source: "MANUAL",
      status: "DRAFT",
      ...carValues(parsed.data),
      createdAt: new Date(),
    })

    await syncImages(id, parsed.data.imagePaths)
    await recordCatalogRequest(agency.id, parsed.data)

    return Response.json({ id }, { status: 201 })
  })
}

export const dynamic = "force-dynamic"
