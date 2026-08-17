import { asc } from "drizzle-orm"

import { db } from "@/db"
import { carMakes, carModels } from "@/db/schema"

/**
 * The whole catalog in one response. It is ~40 makes and ~220 models, small
 * enough that shipping it once beats a round trip every time someone opens the
 * make dropdown, and it makes the dependent model select instant.
 */
export async function GET() {
  const [makes, models] = await Promise.all([
    db.select().from(carMakes).orderBy(asc(carMakes.sort), asc(carMakes.nameEn)),
    db.select().from(carModels).orderBy(asc(carModels.nameEn)),
  ])

  return Response.json(
    {
      makes: makes.map((m) => ({
        id: m.id,
        code: m.code,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
        models: models
          .filter((mo) => mo.makeId === m.id)
          .map((mo) => ({
            id: mo.id,
            code: mo.code,
            nameAr: mo.nameAr,
            nameEn: mo.nameEn,
          })),
      })),
    },
    { headers: { "cache-control": "public, max-age=300" } },
  )
}
