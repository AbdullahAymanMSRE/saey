"use client"

import { useLocale } from "next-intl"
import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { localeNames, type AppLocale } from "@/i18n/routing"

export function LocaleSwitcher({ slug }: { slug?: string }) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const other: AppLocale = locale === "ar" ? "en" : "ar"

  return (
    <Button
      asChild
      size="sm"
      variant="secondary"
      className="shadow-sm backdrop-blur"
    >
      <Link href={pathname || (slug ? `/${slug}` : "/")} locale={other}>
        <Languages className="size-4" />
        {localeNames[other]}
      </Link>
    </Button>
  )
}
