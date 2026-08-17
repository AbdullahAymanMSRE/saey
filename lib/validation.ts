import { z } from "zod"

import {
  BODY_TYPES,
  CITIES,
  CONDITIONS,
  FUELS,
  GEARS,
  LINK_PLATFORMS,
  LISTING_TYPES,
  PHONE_PLATFORMS,
  SLUG_PATTERN,
} from "./constants"
import type { Agency, Car } from "@/db/schema"

/**
 * `nullish`, not `optional`.
 *
 * These columns are nullable, so the settings form round-trips an empty field
 * back as `null`, not as an absent key. Accepting only `string | undefined`
 * rejected every save where the agency had never filled in an about text.
 */
const optionalText = z
  .string()
  .trim()
  .max(4000)
  .nullish()
  .transform((v) => (v ? v : null))

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(SLUG_PATTERN, "Slug must be 3–40 chars: a–z, 0–9 and dashes")

export const createAgencySchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().max(120).optional(),
  slug: slugSchema,
  email: z.email(),
  password: z.string().min(8).max(128),
  /** Admin-owned: the agency can never point imports at another profile. */
  harajUsername: z.string().trim().max(120).optional(),
})

export const updateAgencyAdminSchema = z.object({
  nameAr: z.string().trim().min(2).max(120).optional(),
  nameEn: z.string().trim().max(120).nullable().optional(),
  slug: slugSchema.optional(),
  harajUsername: z.string().trim().max(120).nullable().optional(),
  suspended: z.boolean().optional(),
})

/** What the agency itself may change, note the absence of slug and Haraj username. */
export const agencyProfileSchema = z.object({
  nameAr: z.string().trim().min(2).max(120).optional(),
  nameEn: z.string().trim().max(120).nullable().optional(),
  locales: z.array(z.enum(["ar", "en"])).min(1).max(2).optional(),
  aboutAr: optionalText,
  aboutEn: optionalText,
  city: z.enum(CITIES).nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #1f7a6a")
    .nullable()
    .optional(),
  logoPath: z.string().nullable().optional(),
  coverPath: z.string().nullable().optional(),
})

export const agencyLinksSchema = z.object({
  links: z
    .array(
      z.object({
        platform: z.enum(LINK_PLATFORMS),
        value: z.string().trim().min(1).max(300),
      }),
    )
    .max(LINK_PLATFORMS.length)
    .superRefine((links, ctx) => {
      links.forEach((link, i) => {
        const isPhone = PHONE_PLATFORMS.includes(link.platform)
        if (isPhone && link.value.replace(/\D/g, "").length < 8) {
          ctx.addIssue({
            code: "custom",
            path: [i, "value"],
            message: "Enter a valid phone number",
          })
        }
        if (
          !isPhone &&
          link.platform !== "SNAPCHAT" &&
          !/^https?:\/\//.test(link.value)
        ) {
          ctx.addIssue({
            code: "custom",
            path: [i, "value"],
            message: "Link must start with http:// or https://",
          })
        }
      })
    }),
})

export const carSchema = z
  .object({
    listingType: z.enum(LISTING_TYPES),
    makeId: z.string().nullable().optional(),
    modelId: z.string().nullable().optional(),
    otherMake: z.string().trim().max(80).nullable().optional(),
    otherModel: z.string().trim().max(80).nullable().optional(),
    year: z.number().int().min(1950).max(new Date().getFullYear() + 2).nullable().optional(),
    mileage: z.number().int().min(0).max(2_000_000).nullable().optional(),
    fuel: z.enum(FUELS).nullable().optional(),
    gear: z.enum(GEARS).nullable().optional(),
    condition: z.enum(CONDITIONS).nullable().optional(),
    bodyType: z.enum(BODY_TYPES).nullable().optional(),
    city: z.enum(CITIES).nullable().optional(),
    price: z.number().int().min(0).max(50_000_000).nullable().optional(),
    rateDaily: z.number().int().min(0).max(1_000_000).nullable().optional(),
    rateWeekly: z.number().int().min(0).max(5_000_000).nullable().optional(),
    rateMonthly: z.number().int().min(0).max(20_000_000).nullable().optional(),
    titleAr: z.string().trim().max(200).nullable().optional(),
    titleEn: z.string().trim().max(200).nullable().optional(),
    descriptionAr: z.string().trim().max(6000).nullable().optional(),
    descriptionEn: z.string().trim().max(6000).nullable().optional(),
    isHidden: z.boolean().optional(),
    imagePaths: z.array(z.string()).max(30).optional(),
  })
  .superRefine((car, ctx) => {
    // Make and model are required, but "Other + free text" is always an escape
    // hatch, a brand launching in Riyadh must never block a listing.
    if (!car.makeId && !car.otherMake) {
      ctx.addIssue({ code: "custom", path: ["makeId"], message: "Make is required" })
    }
    if (!car.modelId && !car.otherModel) {
      ctx.addIssue({ code: "custom", path: ["modelId"], message: "Model is required" })
    }
  })

export type CarInput = z.infer<typeof carSchema>

/**
 * The bilingual rule, in one place.
 *
 * A bilingual agency opted into English being required, so a car cannot go live
 * half-translated. This is what blocks Haraj-imported drafts, they arrive
 * Arabic-only by definition, and the import screen surfaces the count so the
 * agency can see exactly how much is left to translate.
 */
export function missingForPublish(
  car: Pick<
    Car,
    | "titleAr"
    | "titleEn"
    | "descriptionAr"
    | "descriptionEn"
    | "listingType"
    | "price"
    | "rateDaily"
    | "rateWeekly"
    | "rateMonthly"
  > & {
    makeId?: string | null
    otherMake?: string | null
    modelId?: string | null
    otherModel?: string | null
    imageCount?: number
  },
  agency: Pick<Agency, "locales">,
): string[] {
  const missing: string[] = []

  if (!car.titleAr?.trim()) missing.push("titleAr")
  if (!car.makeId && !car.otherMake) missing.push("make")
  if (!car.modelId && !car.otherModel) missing.push("model")

  if (car.listingType === "SALE") {
    if (car.price == null) missing.push("price")
  } else if (
    car.rateDaily == null &&
    car.rateWeekly == null &&
    car.rateMonthly == null
  ) {
    missing.push("rate")
  }

  if (agency.locales?.includes("en")) {
    if (!car.titleEn?.trim()) missing.push("titleEn")
    // Description is only demanded in English when there is an Arabic one to
    // match; requiring a translation of nothing would be nonsense.
    if (car.descriptionAr?.trim() && !car.descriptionEn?.trim()) {
      missing.push("descriptionEn")
    }
  }

  return missing
}

export const onboardingSchema = z.object({
  password: z.string().min(8).max(128),
  locales: z.array(z.enum(["ar", "en"])).min(1).max(2),
  nameEn: z.string().trim().max(120).optional(),
  city: z.enum(CITIES).optional(),
  aboutAr: optionalText,
  aboutEn: optionalText,
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoPath: z.string().nullable().optional(),
  coverPath: z.string().nullable().optional(),
  links: z
    .array(
      z.object({
        platform: z.enum(LINK_PLATFORMS),
        value: z.string().trim().min(1).max(300),
      }),
    )
    .optional(),
})

export const makeSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,64}$/),
  nameAr: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
})

export const modelSchema = z.object({
  makeId: z.string().min(1),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{1,64}$/),
  nameAr: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
})
