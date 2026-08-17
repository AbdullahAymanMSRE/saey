# Saey, Car Agency Showroom Platform

Multi-tenant showroom platform for Saudi car agencies. Admin creates agency
accounts; each agency gets a dashboard and a public, QR-linked showroom of cars
for sale or rent.

---

## 1. Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.1 |
| React | React | 19.2.8 |
| Styling | Tailwind + shadcn/ui | 4.3.3 |
| i18n | next-intl | 4.13.6 |
| Client data | TanStack Query | 5.101.4 |
| ORM | Drizzle | 0.45.2 / kit 0.31.10 |
| Auth | better-auth + admin plugin | 1.6.29 |
| Images | sharp | 0.35.3 |
| QR | qrcode | 1.5.4 |
| DB | PostgreSQL (Railway) |, |
| Package manager | **pnpm** |, |
| Deploy | Railway (single instance + volume) |, |

Scaffold:
```
pnpm dlx shadcn@latest init --preset b3JlXbGeYq --base radix --template next --rtl --pointer .
```

---

## 2. Routing & i18n

- **Arabic is default and unprefixed.** `/riyadh-motors` is Arabic;
  `/en/riyadh-motors` is English. next-intl `localePrefix: 'as-needed'`.
- **App routes are namespaced under `/app/*`** (`/app/login`, `/app/dashboard`,
  `/app/admin`) so the URL root belongs entirely to agency slugs and collision is
  structurally impossible.
- Slug format `^[a-z0-9][a-z0-9-]{2,40}$`, still reserving what must live at the
  root: `_next`, `app`, `en`, `robots.txt`, `sitemap.xml`, `favicon.ico`.
- Document direction is `rtl` for `ar`, `ltr` for `en`.

### Per-agency locales
An agency is **Arabic-only** or **bilingual**, chosen in onboarding.

- Bilingual → free text (title, description, about) is **required in both**
  languages; publish is blocked per car until English is present.
- Arabic-only → `/en/<slug>` **301-redirects** to `/<slug>`. One canonical URL
  per showroom, no language switcher rendered.
- Enums (make, model, fuel, gear, condition, body type, city, listing type) are
  stored as codes and translated by us, so cards render correctly in both
  languages regardless of the agency's choice.

---

## 3. Data model (sketch)

```
users                 better-auth (role: admin | agency)
agencies              name_ar, name_en?, slug, haraj_username, locales[],
                      logo, cover, accent_color, about_ar, about_en?,
                      suspended, onboarded_at
agency_links          platform enum (whatsapp, phone, snapchat, instagram,
                      tiktok, x, website, maps) + value
car_makes             code, name_ar, name_en
car_models            make_id, code, name_ar, name_en
cars                  agency_id, listing_type (SALE|RENT), status
                      (DRAFT|PUBLISHED|SOLD|RENTED_OUT), is_hidden,
                      make_id|other_make, model_id|other_model, year,
                      mileage, fuel, gear, condition, body_type, city,
                      price | rate_daily, rate_weekly, rate_monthly,
                      title_ar, title_en?, desc_ar, desc_en?,
                      haraj_post_id?, source
car_images            car_id, path, width, height, sort
catalog_requests      agency-typed "Other" entries awaiting admin promotion
import_runs           agency_id, status, pages, fetched, imported, errors[]
view_events           agency_id, car_id?, visitor_hash, created_at
```

- **`is_hidden` is a boolean orthogonal to `status`**, hiding a SOLD car must
  not erase the fact it sold, since that's the social proof the showroom exists
  to display.
- Sold and rented-out cars stay on the showroom with a badge, sorted after
  available stock.

---

## 4. Auth & accounts

- better-auth, email + password, sessions in Postgres, admin plugin for
  create/suspend/impersonate.
- **No public signup, no email infrastructure.** Admin creates an agency with a
  temp password shown once with a copy button; agency is forced to change it on
  first login. Delivery is manual (WhatsApp), which is how Saudi B2B onboarding
  actually works.
- Password reset = admin regenerates a temp password.
- Impersonation writes an audit log entry.
- First admin comes from a seed script reading `ADMIN_EMAIL` / `ADMIN_PASSWORD`,
  no-op if an admin already exists.
- No billing. Admin suspends manually when a client stops paying.

### Onboarding split
- **Admin sets identity:** name, slug, Haraj username, temp password.
  The agency can never change its Haraj username, this is the ownership
  control, since nothing else prevents importing a competitor's inventory.
- **Agency sets presentation** in a first-login wizard: change password, choose
  Arabic-only vs bilingual, logo, cover, accent colour, contact + social links.
  Lands on the dashboard with a QR code ready.

---

## 5. Showroom (public)

Server Components, fast first paint and real SEO, which matters most for a page
reached by QR code on mobile data.

- Header: logo, name, about, contact strip, language switcher (bilingual only).
- Filters, URL-synced: sale/rent tabs, make, price range, text search, plus
  year, transmission, condition and city behind a "more filters" disclosure.
- Card: image, title, price or daily rate, status badge.
- Detail: gallery, specs, description.
- **CTA: WhatsApp deep-link** (`wa.me/<number>`) prefilled with the car name and
  its showroom URL, plus tap-to-call. Clicks are tracked as a per-car contact
  stat.

---

## 6. Dashboard (agency)

Client-side, TanStack Query against typed `/api` route handlers.

- Cars: list, add, edit, delete, mark sold / rented out, hide.
- Settings: profile, branding, social links, locale mode.
- QR: live preview, **SVG download** (print) + high-res **PNG** (sharing),
  generated on the fly so a slug change can never leave a stale code.
- Stats: most-viewed cars, estimated visitors, contact clicks, trend over time.

---

## 7. Analytics

- Own `view_events` table. Visitor identity is
  `sha256(ip + userAgent + dailySalt)`, no cookie, no consent banner, and
  unlinkable across days, which makes "estimated visitors" an honest label.
- Repeat views deduped within 30 minutes; obvious bots filtered by user-agent.
- Raw events queried directly with proper indexes; rollups deferred until
  measurements say they're needed.

---

## 8. Haraj import

### Verified API contract
`POST https://graphql.haraj.com.sa/?queryName=posts`

- **`?queryName=` is mandatory.** Without it the server returns **HTTP 388 with a
  zero-byte body**, a non-standard status with no error message. (Confirmed the
  hard way during this design pass.)
- Introspection and GraphQL errors are both suppressed the same way, so types are
  hand-written against observed responses.
- `posts(authorUsername, id, page, limit)` → `items[]` + `pageInfo.hasNextPage`.
  Zero-based paging, `limit: 50` accepted. **No total count**, completeness is
  the portal's word.

### What the data actually contains
Verified against live responses:

- `carInfo` is `null` on non-car posts → filter `carOrRelated === 'CAR'`.
- **`carInfo.model` is the model *year*, not the model name.** The first live
  record pulled had `model: 2027` on a post titled `كامري 2007`, the structured
  year and the title disagreed.
- Make and model names exist only inside messy free-form `tags`
  (`["كامري,GLI","كامري 2027","تويوتا"]`).
- **There is no rent concept.** `sellOrWaiver` is SELL vs *waiver* (تنازل).
- `mileage` is frequently `null`; `inputPrice` can be `"0"`.
- `authorUsername` is Arabic with spaces (`"عضو 32 8148"`), must be encoded.
- Body types are available as a clean bilingual map in their bundle
  (سيدان, جيوب, بيك أب, كوبيه, هاتشباك, فان, تراثية…), worth adopting as our enum.

### Import behaviour
- Lands rows as **DRAFT**. Nothing reaches a public showroom unreviewed.
- Maps **only what Haraj actually returns**: images, price, year, fuel, gear,
  condition, city, body type, source URL. **No tag parsing, no LLM.** Make,
  model, listing type and anything else absent from Haraj are left blank for the
  agency to fill.
- Images are **downloaded and re-hosted**, because Haraj ads expire routinely and
  a showroom must not decay into broken images.
- **Repeatable sync that never overwrites agency edits.** Matched on
  `haraj_post_id`: new posts arrive as drafts; already-imported cars are left
  alone, with price/status differences surfaced as a "changed on Haraj" notice to
  accept per car. Vanished ads are flagged, never auto-unpublished.
- Runs as an **in-process async job** with an `import_runs` progress row polled
  by the dashboard. Stale runs (killed by a redeploy) are marked failed; re-import
  is idempotent on `haraj_post_id`.
- Politeness: 300ms between pages, 15s timeout, 3000-listing ceiling recorded as
  a visible truncation rather than a silent one.

---

## 9. Storage

Railway **persistent volume**. Because the container filesystem is otherwise
ephemeral and the volume pins the app to one instance:

- App stays single-instance (no horizontal scaling).
- Uploads resized with sharp on write into a few sizes, originals are never
  served.
- Served through a route handler with long cache headers.
- Volume backups are an operational responsibility, not something the app solves.

---

## 10. Architecture

- **Public showroom:** Server Components.
- **Dashboard + admin:** TanStack Query against `/api` route handlers.
- **Migrations:** `drizzle-kit generate` locally, files committed, applied on
  deploy before boot. Never `push` against real data.

---

## 11. Build order

1. Scaffold, theme, i18n, DB, auth
2. Admin: create / suspend / reset / impersonate agencies
3. Agency onboarding wizard, settings, QR
4. Cars CRUD + make/model catalog
5. Public showroom + filters
6. Analytics
7. **Haraj import last**, most fragile, and depends on the car schema being final

---

## 12. Verified end-to-end

Walked with a real browser against live Haraj data:

- Admin sign-in → create agency → one-time credentials dialog
- Agency sign-in → forced onboarding wizard (password, bilingual, branding, contact)
- **Haraj import against the live API**: 1 ad fetched, 1 car, imported as a draft
  with 10 images mirrored to the volume in 3 sizes each
- The imported row reproduced the contradiction found during design:
  `title = "كامري 2007"` with `year = 2027`, and `make`/`model` left `NULL`
- Publish refused at the **API**, not just the UI: `422 {"missing":
  ["make","model","titleEn","descriptionEn"]}`
- After completing the car: published → visible on `/riyadh-motors` and
  `/en/riyadh-motors`, detail page with WhatsApp CTA and specs
- QR: SVG (1.6KB) and 1200×1200 PNG
- Analytics recorded `SHOWROOM_VIEW` and `CAR_VIEW`

### Bugs found and fixed during that pass

| Bug | Fix |
|---|---|
| `next start` broken by `output: "standalone"` | Dropped standalone, Railway/Nixpacks uses `next start` |
| Root redirected to `/en` for English browsers | `localeDetection: false` |
| Onboarding 500: `PASSWORD_ALREADY_SET` | Hash via `auth.$context` + `internalAdapter.updatePassword` |
| Imported car displayed as "2027" | `carName` now prefers the title when make and model are absent |
| Form fields had no accessible names | `htmlFor`/`id` throughout; `Field` wires it with `useId` |
| Client bundle pulled in sharp | `imageUrl` split into `lib/image-url.ts` |
| lucide-react dropped brand icons | Inline SVG marks in `brand-icons.tsx` |

## 13. Theming

Light / dark / system via next-themes. The agency accent colour applies in both
themes, with its foreground computed from luminance so a pale brand colour never
yields unreadable buttons.
