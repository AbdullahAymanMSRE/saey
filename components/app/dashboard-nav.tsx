"use client"

import { Car, Download, LayoutDashboard, QrCode, Settings } from "lucide-react"

import { AppShell } from "@/components/app/app-shell"

export function DashboardNav({
  title,
  slug,
  impersonating,
  labels,
  children,
}: {
  title: string
  slug: string
  impersonating: string | null
  labels: Record<
    "dashboard" | "cars" | "import" | "qr" | "settings",
    string
  >
  children: React.ReactNode
}) {
  return (
    <AppShell
      title={title}
      showroomSlug={slug}
      impersonating={impersonating}
      items={[
        { href: "/app/dashboard", label: labels.dashboard, icon: LayoutDashboard },
        { href: "/app/dashboard/cars", label: labels.cars, icon: Car },
        { href: "/app/dashboard/import", label: labels.import, icon: Download },
        { href: "/app/dashboard/qr", label: labels.qr, icon: QrCode },
        { href: "/app/dashboard/settings", label: labels.settings, icon: Settings },
      ]}
    >
      {children}
    </AppShell>
  )
}
