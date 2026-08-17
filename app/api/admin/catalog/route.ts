import { asc, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { agencies, carMakes, carModels, catalogRequests } from "@/db/schema"
import { newId } from "@/lib/ids"
import { HttpError, requireAdmin, route } from "@/lib/session"
import { makeSchema, modelSchema } from "@/lib/validation"

export async function GET() {
  return route(async () => {
    await requireAdmin()

    const [makes, models, requests] = await Promise.all([
      db.select().from(carMakes).orderBy(asc(carMakes.sort)),
      db.select().from(carModels).orderBy(asc(carModels.nameEn)),
      db
        .select({
          request: catalogRequests,
          agencyName: agencies.nameAr,
          agencySlug: agencies.slug,
        })
        .from(catalogRequests)
        .innerJoin(agencies, eq(agencies.id, catalogRequests.agencyId))
        .where(eq(catalogRequests.status, "PENDING"))
        .orderBy(desc(catalogRequests.createdAt)),
    ])

    return Response.json({ makes, models, requests })
  })
}

const bodySchema = z.discriminatedUnion("action", [
  makeSchema.extend({ action: z.literal("addMake") }),
  modelSchema.extend({ action: z.literal("addModel") }),
  z.object({
    action: z.literal("resolveRequest"),
    id: z.string().min(1),
    approve: z.boolean(),
    /** Filled in by the admin when promoting a typed name into the catalog. */
    makeId: z.string().nullish(),
    code: z.string().nullish(),
    nameAr: z.string().nullish(),
    nameEn: z.string().nullish(),
  }),
])

export async function POST(req: Request) {
  return route(async () => {
    await requireAdmin()
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) throw new HttpError(400, "Invalid request")
    const body = parsed.data

    if (body.action === "addMake") {
      const [row] = await db
        .insert(carMakes)
        .values({
          id: newId(),
          code: body.code,
          nameAr: body.nameAr,
          nameEn: body.nameEn,
          sort: 999,
        })
        .returning()
      return Response.json({ make: row }, { status: 201 })
    }

    if (body.action === "addModel") {
      const [row] = await db
        .insert(carModels)
        .values({
          id: newId(),
          makeId: body.makeId,
          code: body.code,
          nameAr: body.nameAr,
          nameEn: body.nameEn,
        })
        .returning()
      return Response.json({ model: row }, { status: 201 })
    }

    // resolveRequest
    if (body.approve) {
      if (body.makeId && body.code && body.nameAr && body.nameEn) {
        await db.insert(carModels).values({
          id: newId(),
          makeId: body.makeId,
          code: body.code,
          nameAr: body.nameAr,
          nameEn: body.nameEn,
        })
      } else if (body.code && body.nameAr && body.nameEn) {
        await db.insert(carMakes).values({
          id: newId(),
          code: body.code,
          nameAr: body.nameAr,
          nameEn: body.nameEn,
          sort: 999,
        })
      } else {
        throw new HttpError(400, "Provide a code and both names to approve")
      }
    }

    await db
      .update(catalogRequests)
      .set({ status: body.approve ? "APPROVED" : "REJECTED" })
      .where(eq(catalogRequests.id, body.id))

    return Response.json({ ok: true })
  })
}
