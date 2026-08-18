import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { cars } from "@/db/schema"
import { HttpError, requireAgency, route } from "@/lib/session"
import { missingForPublish } from "@/lib/validation"

const schema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "SOLD", "RENTED_OUT"]).optional(),
  isHidden: z.boolean().optional(),
  /** Clears the "changed on Haraj" notice without touching the car's data. */
  dismissHarajDiff: z.boolean().optional(),
  /** Applies the upstream price the agency chose to accept. */
  acceptHarajPrice: z.boolean().optional(),
})

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const { agency } = await requireAgency()
    const { id } = await ctx.params

    const car = await db.query.cars.findFirst({
      where: and(eq(cars.id, id), eq(cars.agencyId, agency.id)),
    })
    if (!car) throw new HttpError(404, "Car not found")

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) throw new HttpError(400, "Invalid request")
    const body = parsed.data

    const patch: Record<string, unknown> = { updatedAt: new Date() }

    if (body.status) {
      // The bilingual rule bites here: a car cannot go live until it carries
      // everything the agency's chosen languages require.
      if (body.status === "PUBLISHED") {
        const missing = missingForPublish(car, agency)
        if (missing.length) {
          return Response.json(
            { error: "Cannot publish", missing },
            { status: 422 },
          )
        }
      }
      patch.status = body.status
    }

    if (body.isHidden !== undefined) patch.isHidden = body.isHidden

    if (body.acceptHarajPrice) {
      const diff = car.harajDiff as { price?: { to?: number } } | null
      // An accepted upstream figure is a price, so the car stops being "بالسوم".
      if (diff?.price?.to != null) {
        patch.price = diff.price.to
        patch.priceOnRequest = false
      }
      patch.harajDiff = null
    } else if (body.dismissHarajDiff) {
      patch.harajDiff = null
    }

    await db.update(cars).set(patch).where(eq(cars.id, id))
    return Response.json({ ok: true })
  })
}
