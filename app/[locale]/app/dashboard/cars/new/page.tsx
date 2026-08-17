import { getTranslations } from "next-intl/server"

import { CarForm } from "@/components/app/car-form"
import { requireAgency } from "@/lib/session"

export default async function NewCarPage() {
  const { agency } = await requireAgency()
  const t = await getTranslations("Cars")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t("newCar")}</h1>
      <CarForm bilingual={agency.locales.includes("en")} />
    </div>
  )
}
