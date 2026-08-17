import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { AdminNav } from "@/components/app/admin-nav"
import { getSession } from "@/lib/session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user) redirect("/app/login")
  if (session.user.role !== "admin") redirect("/app/dashboard")

  const t = await getTranslations("Nav")
  const tAdmin = await getTranslations("Admin")

  return (
    <AdminNav
      title={tAdmin("title")}
      labels={{ agencies: t("agencies"), catalog: t("catalog") }}
    >
      {children}
    </AdminNav>
  )
}
