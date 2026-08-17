import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const listingTypeEnum = pgEnum("listing_type", ["SALE", "RENT"])

/**
 * SOLD and RENTED_OUT stay visible on the showroom as social proof, that is the
 * whole point of keeping them. Hiding is a separate boolean on the car, so an
 * agency can take a car off the page without erasing the fact that it sold.
 */
export const carStatusEnum = pgEnum("car_status", [
  "DRAFT",
  "PUBLISHED",
  "SOLD",
  "RENTED_OUT",
])

export const fuelEnum = pgEnum("fuel", [
  "GASOLINE",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
])

export const gearEnum = pgEnum("gear", ["AUTO", "MANUAL"])

export const conditionEnum = pgEnum("car_condition", ["NEW", "USED"])

/** Lifted from Haraj's own bilingual body-type map. */
export const bodyTypeEnum = pgEnum("body_type", [
  "SUV",
  "SEDAN",
  "SEDAN_SMALL",
  "SEDAN_LUX",
  "JEEP",
  "JEEP_LUX",
  "COUPE",
  "HATCHBACK",
  "VAN",
  "PICKUP_SMALL",
  "PICKUP_LARGE",
  "ANTIQUE",
])

export const linkPlatformEnum = pgEnum("link_platform", [
  "WHATSAPP",
  "PHONE",
  "SNAPCHAT",
  "INSTAGRAM",
  "TIKTOK",
  "X",
  "WEBSITE",
  "MAPS",
])

export const carSourceEnum = pgEnum("car_source", ["MANUAL", "HARAJ"])

export const importStatusEnum = pgEnum("import_status", [
  "RUNNING",
  "COMPLETED",
  "FAILED",
])

export const eventTypeEnum = pgEnum("event_type", [
  "SHOWROOM_VIEW",
  "CAR_VIEW",
  "CONTACT_CLICK",
])

export const catalogRequestStatusEnum = pgEnum("catalog_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
])

/* -------------------------------------------------------------------------- */
/*  better-auth tables                                                         */
/*  Property keys are camelCase because the Drizzle adapter resolves           */
/*  better-auth's field names against them directly.                           */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // admin plugin
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // Set when the admin creates the account; cleared once the agency picks
  // its own password, which the onboarding wizard forces on first login.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/* -------------------------------------------------------------------------- */
/*  Agencies                                                                   */
/* -------------------------------------------------------------------------- */

export const agencies = pgTable(
  "agencies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** Sits at the URL root, so it is validated and blocklisted on write. */
    slug: varchar("slug", { length: 40 }).notNull(),

    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en"),

    /**
     * ['ar'] or ['ar','en']. When English is enabled, free text is required in
     * both languages before a car may be published.
     */
    locales: jsonb("locales").$type<string[]>().notNull().default(["ar"]),

    logoPath: text("logo_path"),
    coverPath: text("cover_path"),
    /** Applied over the shadcn theme as a CSS variable. */
    accentColor: varchar("accent_color", { length: 32 }),

    aboutAr: text("about_ar"),
    aboutEn: text("about_en"),

    city: text("city"),

    /**
     * Set by the admin and NOT editable by the agency. This is the only control
     * preventing one agency importing a competitor's Haraj inventory.
     */
    harajUsername: text("haraj_username"),

    suspended: boolean("suspended").notNull().default(false),
    onboardedAt: timestamp("onboarded_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("agencies_slug_uq").on(t.slug),
    uniqueIndex("agencies_user_uq").on(t.userId),
  ],
)

export const agencyLinks = pgTable(
  "agency_links",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    platform: linkPlatformEnum("platform").notNull(),
    /** Phone/WhatsApp store an E.164 number; the rest store a URL or handle. */
    value: text("value").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    uniqueIndex("agency_links_uq").on(t.agencyId, t.platform),
    index("agency_links_agency_idx").on(t.agencyId),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Car catalog                                                                */
/* -------------------------------------------------------------------------- */

export const carMakes = pgTable(
  "car_makes",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 64 }).notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("car_makes_code_uq").on(t.code)],
)

export const carModels = pgTable(
  "car_models",
  {
    id: text("id").primaryKey(),
    makeId: text("make_id")
      .notNull()
      .references(() => carMakes.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
  },
  (t) => [
    uniqueIndex("car_models_code_uq").on(t.makeId, t.code),
    index("car_models_make_idx").on(t.makeId),
  ],
)

/**
 * When an agency picks "Other" and types a make or model we don't carry, the
 * car publishes normally and the typed name lands here for the admin to promote
 * into the real catalog. The catalog improves from real usage rather than
 * guesswork, and nothing is ever un-listable.
 */
export const catalogRequests = pgTable(
  "catalog_requests",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    makeId: text("make_id").references(() => carMakes.id, {
      onDelete: "cascade",
    }),
    /** Null when the agency only needed a missing model under a known make. */
    makeName: text("make_name"),
    modelName: text("model_name"),
    status: catalogRequestStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("catalog_requests_status_idx").on(t.status)],
)

/* -------------------------------------------------------------------------- */
/*  Cars                                                                       */
/* -------------------------------------------------------------------------- */

export const cars = pgTable(
  "cars",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),

    listingType: listingTypeEnum("listing_type").notNull(),
    status: carStatusEnum("status").notNull().default("DRAFT"),
    /** Orthogonal to status on purpose, see the enum comment above. */
    isHidden: boolean("is_hidden").notNull().default(false),

    makeId: text("make_id").references(() => carMakes.id),
    modelId: text("model_id").references(() => carModels.id),
    /** Populated only when the agency chose "Other". */
    otherMake: text("other_make"),
    otherModel: text("other_model"),

    year: integer("year"),
    mileage: integer("mileage"),
    fuel: fuelEnum("fuel"),
    gear: gearEnum("gear"),
    condition: conditionEnum("condition"),
    bodyType: bodyTypeEnum("body_type"),
    city: text("city"),

    /** SALE only. Halalas avoided, Saudi car prices are whole riyals. */
    price: integer("price"),
    /** RENT only. Agencies fill whichever tiers they actually offer. */
    rateDaily: integer("rate_daily"),
    rateWeekly: integer("rate_weekly"),
    rateMonthly: integer("rate_monthly"),

    titleAr: text("title_ar"),
    titleEn: text("title_en"),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),

    source: carSourceEnum("source").notNull().default("MANUAL"),
    harajPostId: integer("haraj_post_id"),
    harajUrl: text("haraj_url"),
    /**
     * Set when a re-sync notices the ad changed on Haraj. Surfaced to the agency
     * as a "changed on Haraj" notice they accept per car, never applied
     * silently, because doing so would destroy the catalog picks and English
     * text they entered by hand.
     */
    harajDiff: jsonb("haraj_diff").$type<Record<string, unknown> | null>(),
    /** The ad is gone from Haraj. Flagged only; ads expire there routinely. */
    harajMissing: boolean("haraj_missing").notNull().default(false),
    harajSyncedAt: timestamp("haraj_synced_at"),

    viewCount: integer("view_count").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("cars_agency_idx").on(t.agencyId),
    index("cars_agency_status_idx").on(t.agencyId, t.status, t.isHidden),
    index("cars_listing_type_idx").on(t.agencyId, t.listingType),
    uniqueIndex("cars_haraj_uq").on(t.agencyId, t.harajPostId),
  ],
)

export const carImages = pgTable(
  "car_images",
  {
    id: text("id").primaryKey(),
    carId: text("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    /** Relative to UPLOAD_DIR; served through /api/images. */
    path: text("path").notNull(),
    width: integer("width"),
    height: integer("height"),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("car_images_car_idx").on(t.carId, t.sort)],
)

/* -------------------------------------------------------------------------- */
/*  Haraj import runs                                                          */
/* -------------------------------------------------------------------------- */

export const importRuns = pgTable(
  "import_runs",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    status: importStatusEnum("status").notNull().default("RUNNING"),
    harajUsername: text("haraj_username").notNull(),

    pages: integer("pages").notNull().default(0),
    fetched: integer("fetched").notNull().default(0),
    imported: integer("imported").notNull().default(0),
    skipped: integer("skipped").notNull().default(0),
    changed: integer("changed").notNull().default(0),

    /**
     * Haraj returns no total count, only `hasNextPage`. Recording why a run
     * stopped keeps a truncated sync visible instead of silently passing for a
     * complete one.
     */
    stopReason: text("stop_reason"),
    error: text("error"),
    logs: jsonb("logs").$type<string[]>().notNull().default([]),

    startedAt: timestamp("started_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
    /** Heartbeat, so a run killed by a redeploy can be reaped as stale. */
    heartbeatAt: timestamp("heartbeat_at").notNull().defaultNow(),
  },
  (t) => [index("import_runs_agency_idx").on(t.agencyId, t.startedAt)],
)

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export const viewEvents = pgTable(
  "view_events",
  {
    id: text("id").primaryKey(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    carId: text("car_id").references(() => cars.id, { onDelete: "cascade" }),
    type: eventTypeEnum("type").notNull(),
    /**
     * sha256(ip + userAgent + dailySalt). No cookie, so no consent banner, and
     * the hash is unlinkable across days, which is exactly why the dashboard
     * calls this an *estimated* visitor count rather than a real one.
     */
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("view_events_agency_time_idx").on(t.agencyId, t.createdAt),
    index("view_events_car_idx").on(t.carId, t.createdAt),
    index("view_events_dedupe_idx").on(t.visitorHash, t.createdAt),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Audit                                                                      */
/* -------------------------------------------------------------------------- */

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetId: text("target_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_log_time_idx").on(t.createdAt)],
)

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  user: one(user, { fields: [agencies.userId], references: [user.id] }),
  links: many(agencyLinks),
  cars: many(cars),
}))

export const agencyLinksRelations = relations(agencyLinks, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyLinks.agencyId],
    references: [agencies.id],
  }),
}))

export const carsRelations = relations(cars, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [cars.agencyId],
    references: [agencies.id],
  }),
  make: one(carMakes, { fields: [cars.makeId], references: [carMakes.id] }),
  model: one(carModels, { fields: [cars.modelId], references: [carModels.id] }),
  images: many(carImages),
}))

export const carImagesRelations = relations(carImages, ({ one }) => ({
  car: one(cars, { fields: [carImages.carId], references: [cars.id] }),
}))

export const carMakesRelations = relations(carMakes, ({ many }) => ({
  models: many(carModels),
}))

export const carModelsRelations = relations(carModels, ({ one }) => ({
  make: one(carMakes, { fields: [carModels.makeId], references: [carMakes.id] }),
}))

export type Agency = typeof agencies.$inferSelect
export type Car = typeof cars.$inferSelect
export type CarImage = typeof carImages.$inferSelect
export type CarMake = typeof carMakes.$inferSelect
export type CarModel = typeof carModels.$inferSelect
export type AgencyLink = typeof agencyLinks.$inferSelect
export type ImportRun = typeof importRuns.$inferSelect
