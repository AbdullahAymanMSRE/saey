import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function NotFound() {
  const t = useTranslations("Errors")

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {t("showroomNotFound")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("showroomNotFoundHelp")}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </main>
  )
}
