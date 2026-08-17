import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { agencies, auditLog, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { generatePassword, newId } from "@/lib/ids"
import { HttpError, requireAdmin, route } from "@/lib/session"

/**
 * With no email infrastructure, this is the only account-recovery path there is.
 * The new password is returned exactly once and never stored in readable form ,
 * the admin copies it and sends it on.
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

    const password = generatePassword()

    await auth.api.setUserPassword({
      body: { userId: agency.userId, newPassword: password },
      headers: await headers(),
    })

    await db
      .update(user)
      .set({ mustChangePassword: true })
      .where(eq(user.id, agency.userId))

    await db.insert(auditLog).values({
      id: newId(),
      actorId: session.user.id,
      action: "agency.reset_password",
      targetId: id,
    })

    return Response.json({ password })
  })
}
