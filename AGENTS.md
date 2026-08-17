<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Saey, decisions that are already settled

Multi-tenant showroom platform for Saudi car agencies. Admin creates agency
accounts; each agency gets a dashboard and a public, QR-linked showroom of cars
for sale or rent. Arabic and English.

**These were decided deliberately. Do not re-open them, and do not "simplify"
them away, each one has a reason recorded below.** `DESIGN.md` holds the longer
rationale.

## Hard rules

- **pnpm only.** Never npm or yarn.
- **Use context7** to check a library's current API before writing against it.
- **Locale-aware navigation.** `usePathname`, `useRouter`, `Link`, `redirect`
  come from `@/i18n/navigation`, never `next/navigation`. Using Next's own
  hooks drops the `/en` prefix on push and breaks active-link matching, because
  next-intl's `usePathname` excludes the locale segment and Next's does not.
  (`notFound`, `redirect` in *server* components still come from `next/navigation`;
  `useSearchParams` has no next-intl equivalent and stays as-is.)
- **No `output: "standalone"`** in `next.config.ts`. Railway builds with Nixpacks
  and starts with `next start`, which standalone breaks.
- **`localeDetection: false`.** With it on, a phone set to English lands on `/en`
  even for a Saudi audience, and a QR code for `/riyadh-motors` bounces through
  `/en` first. Arabic is the default because this is the Saudi market.
- **Never `auth.api.setPassword`** for the onboarding password change, it throws
  `PASSWORD_ALREADY_SET`, and an agency always has the admin's temp password.
  Use `auth.$context` → `internalAdapter.updatePassword(userId, ctx.password.hash(pw))`.
- **Every form control needs an associated label** (`htmlFor` + `id`, or the
  `Field` helper in `car-form.tsx`, which wires it via `useId`). A bare `<Label>`
  beside an `<Input>` renders fine and leaves the field with no accessible name.
- **lucide-react has no brand icons**, Instagram/TikTok/X live in
  `components/showroom/brand-icons.tsx` as inline SVG on lucide's 24px grid.
- **`lib/storage.ts` is server-only**, it imports sharp. Client components build
  image URLs from `lib/image-url.ts` instead. Importing storage from a client
  component fails the build with `Can't resolve 'fs'`.

## Routing

- **Arabic is default and unprefixed**: `/riyadh-motors` is Arabic,
  `/en/riyadh-motors` is English. next-intl `localePrefix: 'as-needed'`.
- **Agency slugs live at the URL root**, so every route of ours is namespaced
  under `/app/*` (`/app/login`, `/app/dashboard`, `/app/admin`). This is what
  makes collision structurally impossible.
- Slugs still validate against `SLUG_PATTERN` and `RESERVED_SLUGS`, things like
  `robots.txt` and `_next` are reachable at the root regardless of namespacing.
- **`/en/<slug>` 301-redirects to `/<slug>` for an Arabic-only agency.** One
  canonical URL per showroom; a printed QR code always lands somewhere correct.

## Languages

- An agency is **Arabic-only or bilingual**, chosen during onboarding.
- Bilingual ⇒ **free text is required in both languages before a car publishes.**
  This is enforced in `missingForPublish()` (`lib/validation.ts`), the single
  place that rule lives. Publish is blocked *per car*, naming the missing fields.
- Enums (make, model, fuel, gear, condition, body type, city, listing type) are
  stored as **codes** and translated by us in `messages/*.json`. This is why a
  car card renders correctly in either language regardless of what the agency typed.
- Turning English on **demotes incomplete published cars back to draft**, and the
  settings screen warns with a count *before* the switch is thrown.

## Data model

- **`listingType` is SALE or RENT, never both.** One car, one type.
- Rent uses three optional tiers: `rateDaily` / `rateWeekly` / `rateMonthly`.
  Switching listing type clears the other type's pricing.
- **`isHidden` is a boolean orthogonal to `status`, not a status value.** Hiding
  a SOLD car must not erase that it sold, sold cars staying visible *is* the
  social proof the showroom exists to provide.
- Statuses: `DRAFT | PUBLISHED | SOLD | RENTED_OUT`. Sold and rented-out cars stay
  on the showroom with a badge, sorted after available stock.
- **Make and model are required, with an "Other + free text" escape hatch.** The
  typed name lands in `catalog_requests` for the admin to promote. A new brand
  launching in Riyadh must never block a listing.

## Auth & accounts

- better-auth + admin plugin. **No public signup and no email infrastructure** ,
  by design. Admin creates the account with a temp password shown **once**, and
  hands it over manually (WhatsApp). Password reset = admin regenerates.
- Agency role is `"user"`; admin is `"admin"`. (better-auth types reject a custom
  `"agency"` role at `createUser`.)
- **Admin owns `slug` and `harajUsername`; the agency can never change either.**
  The slug is printed on QR codes. The Haraj username is the *only* control
  preventing an agency importing a competitor's inventory, it is deliberately
  absent from `agencyProfileSchema`.
- Suspension sets both `agencies.suspended` and `user.banned`, so it blocks login
  as well as taking the showroom offline.
- Impersonation always writes an audit-log row and shows a persistent banner.

## Haraj import, verified contract, do not guess

`POST https://graphql.haraj.com.sa/?queryName=posts`

- **`?queryName=` is mandatory.** Without it the server returns **HTTP 388 with a
  zero-byte body**, no error message. Introspection and GraphQL errors fail the
  same silent way, so `lib/haraj/types.ts` is hand-written against observed
  responses. Do not try to codegen it.
- `posts(authorUsername, id, page, limit)` → `items[]` + `pageInfo.hasNextPage`.
  Zero-based paging, `limit: 50` accepted. **No total count exists**, completeness
  is the portal's word, which is why `stopReason` is recorded and surfaced.
- **`carInfo.model` is the model YEAR, not the model name.** Verified against live
  data, and observed disagreeing with the post's own title (`model: 2027` on a
  post titled `كامري 2007`). This is why imports land as drafts.
- **Make and model exist only inside messy free-form `tags`. We do not parse them.**
  Guessing would put wrong data on a public page under the appearance of certainty.
- **Haraj has no rental concept**, `sellOrWaiver` is sell vs *waiver* (تنازل).
  Imports default to SALE; the agency flips it during review.
- Import maps **only what Haraj returns**: images, price, year, fuel, gear,
  condition, city, source URL. Everything else is left blank on purpose.
- **Images are downloaded and re-hosted**, never hotlinked, Haraj ads expire.
- **Re-sync never overwrites agency edits.** Matched on `haraj_post_id`; price
  changes surface as a "changed on Haraj" notice to accept per car. Vanished ads
  are flagged, never auto-unpublished.
- Runs in-process with an `import_runs` progress row polled by the dashboard;
  stale runs (killed by a redeploy) are reaped. Re-import is idempotent.

## Analytics

- Visitor identity is `sha256(ip + userAgent + dailySalt)`, **no cookie**, so no
  consent banner, and unlinkable across days. That is exactly why the UI says
  **"estimated"** visitors. Keep that word.
- Tracked from the client after paint (`ViewTracker`), not during server render,
  so crawlers and prefetches don't inflate an agency's numbers. Bots filtered by
  user-agent; repeat views deduped within 30 minutes.
- Raw events queried directly with indexes. **No rollups until measurement says
  they're needed.**

## Storage & deploy

- **Railway persistent volume**, path from `UPLOAD_DIR`. The container filesystem
  is ephemeral, without the volume every upload dies on redeploy.
- The volume means the app **stays single-instance**; a second replica would not
  see the first one's files.
- Uploads are resized with sharp into thumb/card/full webp on write. Originals are
  never served. Served via `/api/images` with immutable cache headers (content is
  hash-addressed).
- **Migrations: `drizzle-kit generate` locally, files committed, applied on deploy.**
  Never `push` against real data.
- `pnpm db:seed` is idempotent, creates the first admin from `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` only if no admin exists, and upserts the catalog by code.

## Copy and numerals

- **No em-dashes anywhere in user-facing copy**, Arabic or English. Use a comma,
  a colon, or a full stop.
- **Western numerals (1, 2, 3), never Arabic-Indic (١، ٢، ٣)**, even in Arabic.
  The Saudi car market reads Western digits, and so does Haraj. This is enforced
  in three places, all of which matter:
  1. `lib/format.ts` formats with `ar-SA-u-nu-latn`; plain `ar-SA` yields ١٢٬٠٠٠.
  2. `i18n/request.ts` defines a `latn` number format, and Arabic plurals use
     `{count, number, latn}` instead of a bare ICU `#` (which follows the
     locale's default numbering system).
  3. Literal digits in `messages/ar.json` are Latin.

## Typography

- **Cairo** is the Arabic face, loaded once as `--font-arabic` and reused for
  headings via the `.font-display` class. Do not add a second display family:
  one voice across the page is deliberate, and a second Cairo import would
  download the family twice.
- Latin body text is Inter (`--font-sans`).
- **Arabic needs more line-height than Latin at display sizes, and the value is
  tied to the face.** The hero and section headings set leading per locale;
  a single value makes Arabic lines collide or float. These were retuned when
  the type changed from Readex Pro to Cairo, so re-check them if it changes again.
- `@theme inline` in `globals.css` feeds Tailwind's `font-sans`/`font-heading`
  from the next/font variables. Renaming a font variable without updating that
  block silently drops the page to a browser serif.

## Sizing

- **Never change the root font size.** 17px was tried and reverted: it turns
  every rem into a fraction, so `text-sm` renders at 14.875px and `text-xs` at
  12.75px. Size things up with explicit utilities so every value is a whole pixel.
- **14px is the default across the UI primitives.** The radix-lyra preset ships
  everything at 12px; button, badge, input, textarea, select, dropdown item,
  tabs, table and label were all raised to `text-sm`, with heights stepped up to
  match (button default h-9, input h-9, select h-9, badge h-6). Only genuine
  annotations stay at 12px: menu group labels, keyboard shortcuts, table
  captions, and the explicit `xs` button size.
- These are edits to shadcn-generated files in `components/ui/`. Re-running
  `shadcn add <name> --overwrite` reverts them.

## Validation

- Columns that are nullable in the schema must be **`nullish()`** in Zod, not
  `optional()`. A settings form round-trips an untouched field back as `null`,
  not as an absent key, and `optional()` alone rejects it. This was a real bug:
  every profile save failed with "Invalid profile" when the about text was empty.
- `lib/api.ts` folds Zod issue paths into the thrown message, so a validation
  failure names the offending field instead of showing a bare error.

## Providers

- `components/providers.tsx` mounts QueryClient, ThemeProvider, **TooltipProvider**
  and Toaster. Radix Tooltip throws at runtime without a provider above it, and
  `StatCard` uses one, so it belongs at the root rather than per screen.

## Theming

- **Light / dark / system**, via next-themes (`attribute="class"`). The toggle
  sits in the app shell header, the showroom header, the landing page and login.
- `ThemeToggle` renders a neutral icon until mounted, the server cannot know the
  visitor's theme, so resolving it during SSR guarantees a hydration mismatch.
- The agency accent colour is applied to `:root` **and** `.dark`, and its
  foreground is computed from the colour's luminance
  (`readableForeground` in `accent-theme.tsx`) so a pale brand colour never
  produces white-on-white buttons in either theme.

## Architecture

- **Public showroom = Server Components** (fast first paint, real SEO, it is
  reached by QR code on mobile data).
- **Dashboard + admin = TanStack Query against `/api` route handlers.**
- Showroom filters are **URL-synced** so a filtered view is shareable.
- Primary CTA is a **WhatsApp deep link** pre-filled with the car name and its
  showroom URL; the tap is recorded as a `CONTACT_CLICK`.
