import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { LoginForm } from "@/components/app/login-form"
import { LocaleSwitcher } from "@/components/showroom/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  return (
    <main className="relative grid min-h-dvh place-items-center px-4">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <LoginForm />
    </main>
  )
}
