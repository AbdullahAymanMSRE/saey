import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { importRuns } from "@/db/schema"
import { activeRun, runImport } from "@/lib/haraj/import"
import { newId } from "@/lib/ids"
import { HttpError, requireAgency, route } from "@/lib/session"

export async function GET() {
  return route(async () => {
    const { agency } = await requireAgency()

    const [latest] = await db
      .select()
      .from(importRuns)
      .where(eq(importRuns.agencyId, agency.id))
      .orderBy(desc(importRuns.startedAt))
      .limit(1)

    return Response.json({
      harajUsername: agency.harajUsername,
      run: latest ?? null,
      running: latest?.status === "RUNNING",
    })
  })
}

export async function POST() {
  return route(async () => {
    const { agency } = await requireAgency()

    // The agency cannot supply a username; it is whatever the admin set. This
    // is the whole ownership control, see the admin routes.
    if (!agency.harajUsername) {
      throw new HttpError(
        400,
        "No Haraj account is linked to this agency. Ask your administrator to add one.",
      )
    }

    const existing = await activeRun(agency.id)
    if (existing) {
      return Response.json({ id: existing.id, alreadyRunning: true })
    }

    const runId = newId()
    await db.insert(importRuns).values({
      id: runId,
      agencyId: agency.id,
      harajUsername: agency.harajUsername,
      status: "RUNNING",
    })

    // Deliberately not awaited: a 400-ad advertiser takes minutes, far past any
    // HTTP timeout. Progress is followed through the import_runs row, and a run
    // killed by a redeploy is reaped as stale on the next poll.
    void runImport({
      runId,
      agencyId: agency.id,
      username: agency.harajUsername,
    })

    return Response.json({ id: runId }, { status: 202 })
  })
}
