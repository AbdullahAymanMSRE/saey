import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// Next.js recreates modules on every hot reload in dev, which would otherwise
// open a new pool per edit until Postgres refuses connections.
const globalForDb = globalThis as unknown as { __pool?: Pool }

const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString,
    max: 10,
    // Railway's Postgres requires TLS but presents a certificate the default
    // verifier rejects, which is the standard shape for their managed proxy.
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  })

if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool

export const db = drizzle(pool, { schema })
export { schema }
