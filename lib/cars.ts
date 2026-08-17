import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { carImages, cars, catalogRequests, type Agency } from "@/db/schema"

import { newId } from "./ids"
import { deleteImage } from "./storage"
import { missingForPublish, type CarInput } from "./validation"

/**
 * Turns validated input into a row. Kept separate from the route handlers so
 * create and update cannot drift apart on which fields a listing type owns.
 */
export function carValues(input: CarInput) {
  const isSale = input.listingType === "SALE"
  return {
    listingType: input.listingType,
    makeId: input.makeId ?? null,
    modelId: input.modelId ?? null,
    otherMake: input.makeId ? null : (input.otherMake ?? null),
    otherModel: input.modelId ? null : (input.otherModel ?? null),
    year: input.year ?? null,
    mileage: input.mileage ?? null,
    fuel: input.fuel ?? null,
    gear: input.gear ?? null,
    condition: input.condition ?? null,
    bodyType: input.bodyType ?? null,
    city: input.city ?? null,
    // A car is one type or the other, so the other type's pricing is cleared
    // rather than left behind to reappear if the agency switches back.
    price: isSale ? (input.price ?? null) : null,
    rateDaily: isSale ? null : (input.rateDaily ?? null),
    rateWeekly: isSale ? null : (input.rateWeekly ?? null),
    rateMonthly: isSale ? null : (input.rateMonthly ?? null),
    titleAr: input.titleAr ?? null,
    titleEn: input.titleEn ?? null,
    descriptionAr: input.descriptionAr ?? null,
    descriptionEn: input.descriptionEn ?? null,
    isHidden: input.isHidden ?? false,
    updatedAt: new Date(),
  }
}

/**
 * An agency that typed a make or model we don't carry gets their car published
 * anyway; the typed name lands in the admin's queue. Recorded once per distinct
 * name so a dealership listing twelve of the same model doesn't spam the queue.
 */
export async function recordCatalogRequest(
  agencyId: string,
  input: Pick<CarInput, "makeId" | "otherMake" | "otherModel">,
) {
  if (!input.otherMake && !input.otherModel) return

  const existing = await db.query.catalogRequests.findFirst({
    where: (r, { and: A, eq: E }) =>
      A(
        E(r.agencyId, agencyId),
        E(r.status, "PENDING"),
        input.otherMake ? E(r.makeName, input.otherMake) : E(r.modelName, input.otherModel!),
      ),
  })
  if (existing) return

  await db.insert(catalogRequests).values({
    id: newId(),
    agencyId,
    makeId: input.makeId ?? null,
    makeName: input.otherMake ?? null,
    modelName: input.otherModel ?? null,
  })
}

/** Replaces a car's image set, deleting files that are no longer referenced. */
export async function syncImages(carId: string, paths: string[] | undefined) {
  if (!paths) return

  const current = await db
    .select()
    .from(carImages)
    .where(eq(carImages.carId, carId))

  const keep = new Set(paths)
  const removed = current.filter((img) => !keep.has(img.path))

  for (const img of removed) {
    await db.delete(carImages).where(eq(carImages.id, img.id))
    await deleteImage(img.path)
  }

  const existingPaths = new Map(current.map((i) => [i.path, i]))
  for (const [index, path] of paths.entries()) {
    const existing = existingPaths.get(path)
    if (existing) {
      if (existing.sort !== index) {
        await db
          .update(carImages)
          .set({ sort: index })
          .where(eq(carImages.id, existing.id))
      }
    } else {
      await db
        .insert(carImages)
        .values({ id: newId(), carId, path, sort: index })
    }
  }
}

export type PublishCheck = { canPublish: boolean; missing: string[] }

export async function publishCheck(
  carId: string,
  agency: Pick<Agency, "locales">,
): Promise<PublishCheck> {
  const car = await db.query.cars.findFirst({ where: eq(cars.id, carId) })
  if (!car) return { canPublish: false, missing: ["car"] }
  const missing = missingForPublish(car, agency)
  return { canPublish: missing.length === 0, missing }
}

/**
 * Run when an agency turns English on. Published cars that are now incomplete
 * move back to drafts rather than sitting live and half-translated, the agency
 * asked for both languages to be required, and this is what that means.
 */
export async function demoteIncompleteCars(agencyId: string, locales: string[]) {
  if (!locales.includes("en")) return 0

  const published = await db
    .select()
    .from(cars)
    .where(and(eq(cars.agencyId, agencyId), eq(cars.status, "PUBLISHED")))

  let demoted = 0
  for (const car of published) {
    if (missingForPublish(car, { locales }).length) {
      await db
        .update(cars)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(eq(cars.id, car.id))
      demoted++
    }
  }
  return demoted
}

/** How many published cars would be demoted, shown before the switch is thrown. */
export async function countIncompleteIfBilingual(agencyId: string) {
  const published = await db
    .select()
    .from(cars)
    .where(and(eq(cars.agencyId, agencyId), eq(cars.status, "PUBLISHED")))

  return published.filter(
    (car) => missingForPublish(car, { locales: ["ar", "en"] }).length > 0,
  ).length
}
