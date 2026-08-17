# Saey, سعي

Multi-tenant showroom platform for Saudi car agencies. An admin creates agency
accounts; each agency gets a dashboard and a public, QR-linked showroom of cars
for sale or rent, in Arabic and English.

`DESIGN.md` explains why it is built this way. `AGENTS.md` lists the decisions
that are already settled, read it before changing anything.

## Running locally

```bash
pnpm install
cp .env.example .env.local          # then fill in the secrets
createdb saey                       # or point DATABASE_URL at any Postgres
pnpm db:migrate
pnpm db:seed                        # car catalog + first admin from ADMIN_EMAIL/PASSWORD
pnpm dev
```

- Showroom: `http://localhost:3000/<slug>` (Arabic), `/en/<slug>` (English)
- App: `http://localhost:3000/app/login`

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Idempotent: catalog + first admin |
| `pnpm db:studio` | Drizzle Studio |

## Deploying to Railway

1. Create a Postgres service, `DATABASE_URL` is injected automatically.
2. **Attach a volume** and set `UPLOAD_DIR` to its mount path. Without it every
   uploaded photo is lost on redeploy, because the container filesystem is
   ephemeral. The volume also means the app must stay **single-instance**.
3. Set the remaining environment variables from `.env.example` ,
   `NEXT_PUBLIC_APP_URL` must be the real public URL, because every printed QR
   code is generated from it.
4. Build command: `pnpm build`
5. Start command: `pnpm db:migrate && pnpm db:seed && pnpm start`

## Notes

- Package manager is **pnpm**.
- There is no email infrastructure by design: the admin hands over a temporary
  password once, and the agency is forced to change it on first sign-in.
- The Haraj importer is reverse-engineered against an undocumented GraphQL
  endpoint. `lib/haraj/client.ts` documents the contract, including the
  mandatory `?queryName=` parameter whose absence returns a bare HTTP 388.
