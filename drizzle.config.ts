import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Next.js reads .env.local automatically; drizzle-kit runs outside Next, so it
// has to be told. Railway injects DATABASE_URL directly and neither file exists
// there, which is why this is best-effort rather than required.
config({ path: ".env.local" })
config({ path: ".env" })

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
