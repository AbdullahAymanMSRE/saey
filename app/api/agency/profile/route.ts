import { eq } from "drizzle-orm"

import { db } from "@/db"
import { agencies, agencyLinks } from "@/db/schema"
import {
  countIncompleteIfBilingual,
  demoteIncompleteCars,
} from "@/lib/cars"
import { newId } from "@/lib/ids"
import { requireAgency, route } from "@/lib/session"
import { agencyLinksSchema, agencyProfileSchema } from "@/lib/validation"

export async function GET() {
  return route(async () => {
    const { agency } = await requireAgency()
    const links = await db
      .select()
      .from(agencyLinks)
      .where(eq(agencyLinks.agencyId, agency.id))

    return Response.json({
      agency,
      links,
      // Surfaced so the settings screen can warn *before* the switch is thrown
      // rather than after cars have already dropped off the showroom.
      wouldDemote: await countIncompleteIfBilingual(agency.id),
    })
  })
}

export async function PATCH(req: Request) {
  return route(async () => {
    const { agency } = await requireAgency()
    const body = await req.json()

    const profile = agencyProfileSchema.safeParse(body)
    if (!profile.success) {
      return Response.json(
        { error: "Invalid profile", issues: profile.error.issues },
        { status: 400 },
      )
    }

    // Slug and Haraj username are deliberately absent from the schema: both are
    // admin-owned. The slug is printed on QR codes, and the Haraj username is
    // what stops an agency importing a competitor's inventory.
    await db
      .update(agencies)
      .set({ ...profile.data, updatedAt: new Date() })
      .where(eq(agencies.id, agency.id))

    let demoted = 0
    if (profile.data.locales) {
      demoted = await demoteIncompleteCars(agency.id, profile.data.locales)
    }

    if (body.links) {
      const links = agencyLinksSchema.safeParse({ links: body.links })
      if (!links.success) {
        return Response.json(
          { error: "Invalid links", issues: links.error.issues },
          { status: 400 },
        )
      }
      await db.delete(agencyLinks).where(eq(agencyLinks.agencyId, agency.id))
      if (links.data.links.length) {
        await db.insert(agencyLinks).values(
          links.data.links.map((link, i) => ({
            id: newId(),
            agencyId: agency.id,
            platform: link.platform,
            value: link.value,
            sort: i,
          })),
        )
      }
    }

    return Response.json({ ok: true, demoted })
  })
}
