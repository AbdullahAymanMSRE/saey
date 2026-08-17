import "dotenv/config"

import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { newId } from "@/lib/ids"
import { ensureUploadDir } from "@/lib/storage"

import { db } from "./index"
import { CATALOG } from "./catalog"
import { carMakes, carModels, user } from "./schema"

/**
 * Idempotent. Safe to run on every deploy: it creates the first admin only when
 * no admin exists, and upserts catalog rows by their stable codes.
 */
async function main() {
  await ensureUploadDir()

  /* ---------------------------------------------------------------- catalog */
  let makeCount = 0
  let modelCount = 0

  for (const [i, make] of CATALOG.entries()) {
    const existingMake = await db.query.carMakes.findFirst({
      where: eq(carMakes.code, make.code),
    })

    const makeId = existingMake?.id ?? newId()
    if (existingMake) {
      await db
        .update(carMakes)
        .set({ nameAr: make.nameAr, nameEn: make.nameEn, sort: i })
        .where(eq(carMakes.id, makeId))
    } else {
      await db.insert(carMakes).values({
        id: makeId,
        code: make.code,
        nameAr: make.nameAr,
        nameEn: make.nameEn,
        sort: i,
      })
      makeCount++
    }

    for (const [code, nameEn, nameAr] of make.models) {
      const existing = await db.query.carModels.findFirst({
        where: (m, { and, eq: e }) => and(e(m.makeId, makeId), e(m.code, code)),
      })
      if (existing) {
        await db
          .update(carModels)
          .set({ nameAr, nameEn })
          .where(eq(carModels.id, existing.id))
      } else {
        await db
          .insert(carModels)
          .values({ id: newId(), makeId, code, nameAr, nameEn })
        modelCount++
      }
    }
  }

  console.log(
    `Catalog: ${CATALOG.length} makes / ${CATALOG.reduce((n, m) => n + m.models.length, 0)} models ` +
      `(${makeCount} new makes, ${modelCount} new models)`,
  )

  /* ------------------------------------------------------------------ admin */
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.")
    return
  }

  const existingAdmin = await db.query.user.findFirst({
    where: eq(user.role, "admin"),
  })
  if (existingAdmin) {
    console.log(`Admin already exists (${existingAdmin.email}), nothing to do.`)
    return
  }

  // Created through better-auth rather than a raw insert so the password is
  // hashed with exactly the algorithm sign-in will later verify against.
  const created = await auth.api.signUpEmail({
    body: { email, password, name: "Administrator" },
  })

  await db
    .update(user)
    .set({ role: "admin", emailVerified: true })
    .where(eq(user.id, created.user.id))

  console.log(`Created admin ${email}. Change this password after first login.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
