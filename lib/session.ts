import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { agencies } from "@/db/schema"

import { auth } from "./auth"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.user) throw new HttpError(401, "Not signed in")
  return session
}

export async function requireAdmin() {
  const session = await requireUser()
  if (session.user.role !== "admin") throw new HttpError(403, "Admins only")
  return session
}

/**
 * Resolves the signed-in agency. A suspended agency is refused here rather than
 * only at the showroom, so a client who stopped paying cannot keep editing
 * inventory behind an offline page.
 */
export async function requireAgency() {
  const session = await requireUser()
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, session.user.id),
  })
  if (!agency) throw new HttpError(403, "No agency is linked to this account")
  if (agency.suspended) throw new HttpError(403, "This account is suspended")
  return { session, agency }
}

/** Wraps a route handler so thrown HttpErrors become real HTTP responses. */
export function route<T>(handler: () => Promise<T>) {
  return handler().catch((err: unknown) => {
    if (err instanceof HttpError) {
      return Response.json({ error: err.message }, { status: err.status })
    }
    console.error(err)
    return Response.json({ error: "Internal error" }, { status: 500 })
  })
}
