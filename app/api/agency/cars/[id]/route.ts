import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { carImages, cars } from "@/db/schema"
import { carValues, recordCatalogRequest, syncImages } from "@/lib/cars"
import { HttpError, requireAgency, route } from "@/lib/session"
import { deleteImage } from "@/lib/storage"
import { carSchema, missingForPublish } from "@/lib/validation"

/** Scoped by agency on every call, so an id from another agency is a 404. */
async function ownedCar(agencyId: string, id: string) {
  const car = await db.query.cars.findFirst({
    where: and(eq(cars.id, id), eq(cars.agencyId, agencyId)),
    with: { images: { orderBy: (i, { asc }) => [asc(i.sort)] } },
  })
  if (!car) throw new HttpError(404, "Car not found")
  return car
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { agency } = await requireAgency()
    const { id } = await ctx.params
    const car = await ownedCar(agency.id, id)
    return Response.json({ car: { ...car, missing: missingForPublish(car, agency) } })
  })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { agency } = await requireAgency()
    const { id } = await ctx.params
    const existing = await ownedCar(agency.id, id)

    const parsed = carSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid car", issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const values = carValues(parsed.data)
    await db.update(cars).set(values).where(eq(cars.id, id))
    await syncImages(id, parsed.data.imagePaths)
    await recordCatalogRequest(agency.id, parsed.data)

    // A published car edited into an incomplete state goes back to drafts
    // rather than staying live with a missing price or translation.
    if (existing.status === "PUBLISHED") {
      const updated = await db.query.cars.findFirst({ where: eq(cars.id, id) })
      if (updated && missingForPublish(updated, agency).length) {
        await db.update(cars).set({ status: "DRAFT" }).where(eq(cars.id, id))
        return Response.json({ ok: true, demoted: true })
      }
    }

    return Response.json({ ok: true })
  })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { agency } = await requireAgency()
    const { id } = await ctx.params
    await ownedCar(agency.id, id)

    // Files first: the rows cascade away with the car, and an orphaned row is
    // recoverable in a way an orphaned file on a volume is not.
    const images = await db
      .select()
      .from(carImages)
      .where(eq(carImages.carId, id))
    await Promise.all(images.map((img) => deleteImage(img.path)))

    await db.delete(cars).where(eq(cars.id, id))
    return Response.json({ ok: true })
  })
}
