import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { db } from "@/db"
import { agencies } from "@/db/schema"
import { getSession } from "@/lib/session"

/**
 * The single place that decides where a signed-in person belongs. Keeping it
 * server-side means the answer cannot be wrong for a moment on the client, and
 * the login form never has to know about roles or onboarding state.
 */
export default async function AppEntry() {
  const session = await getSession()
  if (!session?.user) redirect("/app/login")

  if (session.user.role === "admin") redirect("/app/admin")

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, session.user.id),
  })
  if (!agency) redirect("/app/login")

  // A temporary password or an unfinished profile both mean the wizard.
  if (!agency.onboardedAt || session.user.mustChangePassword) {
    redirect("/app/onboarding")
  }

  redirect("/app/dashboard")
}
