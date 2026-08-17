"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { LogOut, ExternalLink, Menu, UserRoundCog } from "lucide-react"
import { useState } from "react"

import { LocaleSwitcher } from "@/components/showroom/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link } from "@/i18n/navigation"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function AppShell({
  items,
  title,
  showroomSlug,
  impersonating,
  children,
}: {
  items: NavItem[]
  title: string
  showroomSlug?: string
  impersonating?: string | null
  children: React.ReactNode
}) {
  const t = useTranslations("Common")
  const tAdmin = useTranslations("Admin")
  const tNav = useTranslations("Nav")
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  async function signOut() {
    await authClient.signOut()
    router.replace("/app/login")
  }

  async function stopImpersonating() {
    await authClient.admin.stopImpersonating()
    router.replace("/app/admin")
    router.refresh()
  }

  return (
    <div className="min-h-dvh">
      {/* Impersonation is never invisible, the banner is the whole safeguard. */}
      {impersonating && (
        <div className="bg-primary text-primary-foreground flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm">
          <UserRoundCog className="size-4" />
          {tAdmin("impersonatingBanner", { name: impersonating })}
          <Button
            size="sm"
            variant="secondary"
            className="h-7"
            onClick={stopImpersonating}
          >
            {tAdmin("stopImpersonating")}
          </Button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="border-border/60 hidden border-e p-4 lg:block">
          <div className="mb-6 px-3">
            <Link href="/app" className="text-lg font-semibold tracking-tight">
              {t("appName")}
            </Link>
            <p className="text-muted-foreground truncate text-xs">{title}</p>
          </div>
          {nav}

          <div className="mt-6 space-y-1 border-t pt-4">
            {showroomSlug && (
              <a
                href={`/${showroomSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <ExternalLink className="size-4" />
                {tNav("showroom")}
              </a>
            )}
            <button
              onClick={signOut}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <LogOut className="size-4" />
              {t("signOut")}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-border/60 flex items-center gap-3 border-b px-4 py-3 lg:justify-end">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              {/* Sheet only understands physical sides, so the logical one is
                  resolved from the active locale. */}
              <SheetContent
                side={locale === "ar" ? "right" : "left"}
                className="w-72 p-4"
              >
                <SheetTitle className="mb-6 px-3">{t("appName")}</SheetTitle>
                {nav}
                <div className="mt-6 space-y-1 border-t pt-4">
                  {showroomSlug && (
                    <a
                      href={`/${showroomSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:bg-accent flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                    >
                      <ExternalLink className="size-4" />
                      {tNav("showroom")}
                    </a>
                  )}
                  <button
                    onClick={signOut}
                    className="text-muted-foreground hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                  >
                    <LogOut className="size-4" />
                    {t("signOut")}
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <span className="min-w-0 flex-1 truncate font-medium lg:hidden">{title}</span>
            <ThemeToggle />
            <LocaleSwitcher />
          </header>

          {/* Centred with a max width: without it, content clings to the start
              edge and leaves a wide empty gutter on a desktop monitor. */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
