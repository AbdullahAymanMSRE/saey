import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/components/app/onboarding-wizard"
import { db } from "@/db"
import { agencies } from "@/db/schema"
import { getSession } from "@/lib/session"

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session?.user) redirect("/app/login")

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, session.user.id),
  })
  if (!agency) redirect("/app/login")

  // Already set up and using their own password, nothing left to ask.
  if (agency.onboardedAt && !session.user.mustChangePassword) {
    redirect("/app/dashboard")
  }

  return (
    <main className="px-4">
      <OnboardingWizard slug={agency.slug} />
    </main>
  )
}
