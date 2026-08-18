import { and, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { CarForm } from "@/components/app/car-form"
import { db } from "@/db"
import { cars } from "@/db/schema"
import { requireAgency } from "@/lib/session"

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { agency } = await requireAgency()
  const { id } = await params

  const car = await db.query.cars.findFirst({
    where: and(eq(cars.id, id), eq(cars.agencyId, agency.id)),
    with: { images: { orderBy: (i, { asc }) => [asc(i.sort)] } },
  })
  if (!car) notFound()

  const t = await getTranslations("Cars")

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t("editCar")}</h1>
      <CarForm
        carId={car.id}
        bilingual={agency.locales.includes("en")}
        initial={{
          listingType: car.listingType,
          makeId: car.makeId,
          modelId: car.modelId,
          otherMake: car.otherMake,
          otherModel: car.otherModel,
          year: car.year,
          mileage: car.mileage,
          fuel: car.fuel,
          gear: car.gear,
          condition: car.condition,
          bodyType: car.bodyType,
          city: car.city,
          price: car.price,
          rateDaily: car.rateDaily,
          rateWeekly: car.rateWeekly,
          rateMonthly: car.rateMonthly,
          priceOnRequest: car.priceOnRequest,
          titleAr: car.titleAr,
          titleEn: car.titleEn,
          descriptionAr: car.descriptionAr,
          descriptionEn: car.descriptionEn,
          isHidden: car.isHidden,
          imagePaths: car.images.map((i) => i.path),
        }}
      />
    </div>
  )
}
