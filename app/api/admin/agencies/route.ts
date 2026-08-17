import { count, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { agencies, auditLog, cars, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { newId } from "@/lib/ids"
import { requireAdmin, route } from "@/lib/session"
import { validateSlug } from "@/lib/urls"
import { createAgencySchema } from "@/lib/validation"

export async function GET() {
  return route(async () => {
    await requireAdmin()

    const rows = await db
      .select({
        agency: agencies,
        email: user.email,
        banned: user.banned,
      })
      .from(agencies)
      .innerJoin(user, eq(user.id, agencies.userId))
      .orderBy(desc(agencies.createdAt))

    const carCounts = await db
      .select({ agencyId: cars.agencyId, value: count() })
      .from(cars)
      .groupBy(cars.agencyId)

    const byAgency = new Map(carCounts.map((c) => [c.agencyId, c.value]))

    return Response.json({
      agencies: rows.map((r) => ({
        ...r.agency,
        email: r.email,
        carCount: byAgency.get(r.agency.id) ?? 0,
      })),
    })
  })
}

export async function POST(req: Request) {
  return route(async () => {
    const session = await requireAdmin()
    const parsed = createAgencySchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid details", issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const input = parsed.data

    const slugProblem = validateSlug(input.slug)
    if (slugProblem) {
      return Response.json({ error: `slug:${slugProblem}` }, { status: 400 })
    }

    const taken = await db.query.agencies.findFirst({
      where: eq(agencies.slug, input.slug),
    })
    if (taken) return Response.json({ error: "slug:taken" }, { status: 409 })

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, input.email),
    })
    if (existingUser) {
      return Response.json({ error: "email:taken" }, { status: 409 })
    }

    // Created through better-auth so the password hash matches what sign-in
    // will verify against; a raw insert here would produce an account that can
    // never log in.
    const created = await auth.api.createUser({
      body: {
        email: input.email,
        password: input.password,
        name: input.nameEn || input.nameAr,
        role: "user",
      },
    })

    await db
      .update(user)
      .set({ mustChangePassword: true, emailVerified: true })
      .where(eq(user.id, created.user.id))

    const agencyId = newId()
    await db.insert(agencies).values({
      id: agencyId,
      userId: created.user.id,
      slug: input.slug,
      nameAr: input.nameAr,
      nameEn: input.nameEn || null,
      harajUsername: input.harajUsername || null,
      locales: ["ar"],
    })

    await db.insert(auditLog).values({
      id: newId(),
      actorId: session.user.id,
      action: "agency.create",
      targetId: agencyId,
      meta: { slug: input.slug, email: input.email },
    })

    return Response.json({ id: agencyId }, { status: 201 })
  })
}
