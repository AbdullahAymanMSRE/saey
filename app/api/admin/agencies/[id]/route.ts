import { eq } from "drizzle-orm"

import { db } from "@/db"
import { agencies, auditLog, user } from "@/db/schema"
import { newId } from "@/lib/ids"
import { HttpError, requireAdmin, route } from "@/lib/session"
import { validateSlug } from "@/lib/urls"
import { updateAgencyAdminSchema } from "@/lib/validation"

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const session = await requireAdmin()
    const { id } = await ctx.params

    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, id),
    })
    if (!agency) throw new HttpError(404, "Agency not found")

    const parsed = updateAgencyAdminSchema.safeParse(await req.json())
    if (!parsed.success) throw new HttpError(400, "Invalid details")
    const input = parsed.data

    if (input.slug && input.slug !== agency.slug) {
      const problem = validateSlug(input.slug)
      if (problem) {
        return Response.json({ error: `slug:${problem}` }, { status: 400 })
      }
      const taken = await db.query.agencies.findFirst({
        where: eq(agencies.slug, input.slug),
      })
      if (taken) return Response.json({ error: "slug:taken" }, { status: 409 })
    }

    await db
      .update(agencies)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(agencies.id, id))

    // Suspension has to reach the login path too, not just the showroom ,
    // otherwise a client who stopped paying keeps editing behind a dark page.
    if (input.suspended !== undefined) {
      await db
        .update(user)
        .set({ banned: input.suspended })
        .where(eq(user.id, agency.userId))
    }

    await db.insert(auditLog).values({
      id: newId(),
      actorId: session.user.id,
      action: "agency.update",
      targetId: id,
      meta: input as Record<string, unknown>,
    })

    return Response.json({ ok: true })
  })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const session = await requireAdmin()
    const { id } = await ctx.params

    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, id),
    })
    if (!agency) throw new HttpError(404, "Agency not found")

    // The agency row, its cars and its images cascade from the user.
    await db.delete(user).where(eq(user.id, agency.userId))

    await db.insert(auditLog).values({
      id: newId(),
      actorId: session.user.id,
      action: "agency.delete",
      targetId: id,
      meta: { slug: agency.slug },
    })

    return Response.json({ ok: true })
  })
}
