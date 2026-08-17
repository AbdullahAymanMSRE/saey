import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { agencies, auditLog } from "@/db/schema"
import { auth } from "@/lib/auth"
import { newId } from "@/lib/ids"
import { HttpError, requireAdmin, route } from "@/lib/session"

/**
 * Impersonation is never silent, every use writes an audit entry naming the
 * admin, the agency, and when.
 */
export async function POST(
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

    await auth.api.impersonateUser({
      body: { userId: agency.userId },
      headers: await headers(),
    })

    await db.insert(auditLog).values({
      id: newId(),
      actorId: session.user.id,
      action: "agency.impersonate",
      targetId: id,
      meta: { slug: agency.slug },
    })

    return Response.json({ ok: true })
  })
}
