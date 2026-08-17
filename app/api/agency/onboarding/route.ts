import { eq } from "drizzle-orm"

import { db } from "@/db"
import { agencies, agencyLinks, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { newId } from "@/lib/ids"
import { requireAgency, route } from "@/lib/session"
import { onboardingSchema } from "@/lib/validation"

/**
 * The agency half of onboarding. The admin already set the things that must be
 * controlled, name, slug, Haraj username, so what lands here is presentation
 * plus the forced password change.
 */
export async function POST(req: Request) {
  return route(async () => {
    const { agency, session } = await requireAgency()
    const parsed = onboardingSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid details", issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const { password, links, ...profile } = parsed.data

    // NOT `auth.api.setPassword`, that endpoint refuses with
    // PASSWORD_ALREADY_SET, and an agency arriving here always has one (the
    // admin's temp password). `changePassword` would work but demands the
    // current password, which we would have to ask for again on the very screen
    // whose job is to retire it. Hashing through the auth context uses the same
    // algorithm sign-in verifies against.
    const ctx = await auth.$context
    await ctx.internalAdapter.updatePassword(
      session.user.id,
      await ctx.password.hash(password),
    )

    await db
      .update(user)
      .set({ mustChangePassword: false })
      .where(eq(user.id, session.user.id))

    await db
      .update(agencies)
      .set({ ...profile, onboardedAt: new Date(), updatedAt: new Date() })
      .where(eq(agencies.id, agency.id))

    if (links?.length) {
      await db.delete(agencyLinks).where(eq(agencyLinks.agencyId, agency.id))
      await db.insert(agencyLinks).values(
        links.map((link, i) => ({
          id: newId(),
          agencyId: agency.id,
          platform: link.platform,
          value: link.value,
          sort: i,
        })),
      )
    }

    return Response.json({ ok: true, slug: agency.slug })
  })
}
