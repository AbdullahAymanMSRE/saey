import { getTranslations } from "next-intl/server"

import { ImportPanel } from "@/components/app/import-panel"

export default async function ImportPage() {
  const t = await getTranslations("Import")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <ImportPanel />
    </div>
  )
}
