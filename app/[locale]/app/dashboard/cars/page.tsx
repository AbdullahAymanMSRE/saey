import { Suspense } from "react"

import { CarsList } from "@/components/app/cars-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function CarsPage() {
  // useSearchParams inside CarsList needs a boundary during prerender.
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
      <CarsList />
    </Suspense>
  )
}
