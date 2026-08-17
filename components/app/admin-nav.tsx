"use client"

import { Building2, ListTree } from "lucide-react"

import { AppShell } from "@/components/app/app-shell"

export function AdminNav({
  title,
  labels,
  children,
}: {
  title: string
  labels: { agencies: string; catalog: string }
  children: React.ReactNode
}) {
  return (
    <AppShell
      title={title}
      items={[
        { href: "/app/admin", label: labels.agencies, icon: Building2 },
        { href: "/app/admin/catalog", label: labels.catalog, icon: ListTree },
      ]}
    >
      {children}
    </AppShell>
  )
}
