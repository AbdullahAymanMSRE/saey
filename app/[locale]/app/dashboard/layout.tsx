import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { DashboardNav } from "@/components/app/dashboard-nav"
import { db } from "@/db"
import { agencies } from "@/db/schema"
import { getSession } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user) redirect("/app/login")
  if (session.user.role === "admin") redirect("/app/admin")

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.userId, session.user.id),
  })
  if (!agency) redirect("/app/login")
  if (!agency.onboardedAt || session.user.mustChangePassword) {
    redirect("/app/onboarding")
  }

  const t = await getTranslations("Nav")

  // When an admin is impersonating, better-auth records who on the session.
  let impersonating: string | null = null
  if (session.session.impersonatedBy) {
    const [row] = await db
      .select({ name: agencies.nameAr })
      .from(agencies)
      .where(eq(agencies.userId, session.user.id))
    impersonating = row?.name ?? session.user.email
  }

  return (
    <DashboardNav
      title={agency.nameAr}
      slug={agency.slug}
      impersonating={impersonating}
      labels={{
        dashboard: t("dashboard"),
        cars: t("cars"),
        import: t("import"),
        qr: t("qr"),
        settings: t("settings"),
      }}
    >
      {children}
    </DashboardNav>
  )
}
