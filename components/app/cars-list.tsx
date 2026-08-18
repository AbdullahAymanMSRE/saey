"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "@/i18n/navigation"
import { api } from "@/lib/api"
import { carName, formatPrice, primaryRate } from "@/lib/format"
import { imageUrl } from "@/lib/image-url"

type CarRow = {
  id: string
  listingType: "SALE" | "RENT"
  status: "DRAFT" | "PUBLISHED" | "SOLD" | "RENTED_OUT"
  isHidden: boolean
  price: number | null
  priceOnRequest: boolean
  rateDaily: number | null
  rateWeekly: number | null
  rateMonthly: number | null
  year: number | null
  titleAr: string | null
  titleEn: string | null
  otherMake: string | null
  otherModel: string | null
  viewCount: number
  source: "MANUAL" | "HARAJ"
  harajUrl: string | null
  harajDiff: Record<string, unknown> | null
  harajMissing: boolean
  make: { nameAr: string; nameEn: string } | null
  model: { nameAr: string; nameEn: string } | null
  images: { id: string; path: string }[]
  /** Exactly what this car is waiting on before it can be published. */
  missing: string[]
}

const STATUS_VARIANT = {
  DRAFT: "outline",
  PUBLISHED: "default",
  SOLD: "secondary",
  RENTED_OUT: "secondary",
} as const

export function CarsList() {
  const t = useTranslations("Cars")
  const tc = useTranslations("Common")
  const locale = useLocale()
  const params = useSearchParams()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState(params.get("status") ?? "ALL")
  const [type, setType] = useState("ALL")
  const [sort, setSort] = useState("newest")

  const { data, isPending } = useQuery({
    queryKey: ["cars", status, type, sort],
    queryFn: () =>
      api<{ cars: CarRow[] }>(
        `/api/agency/cars?status=${status}&listingType=${type}&sort=${sort}`,
      ),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["cars"] })

  const patchStatus = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api(`/api/agency/cars/${id}/status`, { method: "POST", json: body }),
    onSuccess: () => {
      invalidate()
      toast.success(tc("save"))
    },
    onError: (err: Error & { body?: { missing?: string[] } }) => {
      const missing = err.body?.missing
      if (missing?.length) {
        // Name the actual gaps rather than a generic refusal, for a bilingual
        // agency this is usually "the English title", and they need to know.
        toast.error(
          `${t("cannotPublish")}: ${missing
            .map((m) => t(`missing.${m}` as "missing.titleAr"))
            .join("، ")}`,
        )
      } else {
        toast.error(err.message)
      }
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/api/agency/cars/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate()
      toast.success(tc("delete"))
    },
  })

  const cars = data?.cars ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <Button asChild size="sm">
          <Link href="/app/dashboard/cars/new">
            <Plus className="size-4" />
            {t("addCar")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filterAll")}</SelectItem>
            <SelectItem value="DRAFT">{t("DRAFT")}</SelectItem>
            <SelectItem value="PUBLISHED">{t("PUBLISHED")}</SelectItem>
            <SelectItem value="SOLD">{t("SOLD")}</SelectItem>
            <SelectItem value="RENTED_OUT">{t("RENTED_OUT")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filterAll")}</SelectItem>
            <SelectItem value="SALE">{t("SALE")}</SelectItem>
            <SelectItem value="RENT">{t("RENT")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sortNewest")}</SelectItem>
            <SelectItem value="views">{t("sortMostViewed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="border-border/60 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">{t("noCars")}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t("noCarsHelp")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cars.map((car) => {
            const name = carName(car, locale)
            const rate = primaryRate(car)
            const canPublish = car.missing.length === 0

            return (
              <div
                key={car.id}
                className="border-border/60 bg-card flex flex-wrap items-center gap-4 rounded-lg border p-3"
              >
                <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-md">
                  {car.images[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl(car.images[0].path, "thumb")}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-40 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{name || "-"}</span>
                    <Badge variant={STATUS_VARIANT[car.status]}>
                      {t(car.status)}
                    </Badge>
                    {car.isHidden && (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="size-3" />
                        {t("hidden")}
                      </Badge>
                    )}
                    {car.source === "HARAJ" && (
                      <Badge variant="outline">{t("fromHaraj")}</Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mt-1 text-sm">
                    {car.priceOnRequest
                      ? t("priceOnRequest")
                      : car.listingType === "SALE"
                        ? car.price != null
                          ? `${formatPrice(car.price, locale)} ${tc("currency")}`
                          : "-"
                        : rate
                          ? `${formatPrice(rate.value, locale)} ${tc("currency")} ${tc(rate.period)}`
                          : "-"}
                    {" · "}
                    {t("views", { count: car.viewCount })}
                  </p>

                  {!canPublish && car.status === "DRAFT" && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t("missingFields", {
                        fields: car.missing
                          .map((m) => t(`missing.${m}` as "missing.titleAr"))
                          .join("، "),
                      })}
                    </p>
                  )}

                  {car.harajDiff && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {t("harajChanged")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() =>
                          patchStatus.mutate({
                            id: car.id,
                            acceptHarajPrice: true,
                          })
                        }
                      >
                        {t("acceptChange")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() =>
                          patchStatus.mutate({
                            id: car.id,
                            dismissHarajDiff: true,
                          })
                        }
                      >
                        {t("dismissChange")}
                      </Button>
                    </div>
                  )}

                  {car.harajMissing && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t("harajMissing")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/app/dashboard/cars/${car.id}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {car.status !== "PUBLISHED" && (
                        <DropdownMenuItem
                          disabled={!canPublish}
                          onClick={() =>
                            patchStatus.mutate({
                              id: car.id,
                              status: "PUBLISHED",
                            })
                          }
                        >
                          <Upload className="size-4" />
                          {t("publish")}
                        </DropdownMenuItem>
                      )}
                      {car.status === "PUBLISHED" && (
                        <DropdownMenuItem
                          onClick={() =>
                            patchStatus.mutate({ id: car.id, status: "DRAFT" })
                          }
                        >
                          {t("unpublish")}
                        </DropdownMenuItem>
                      )}

                      {car.listingType === "SALE"
                        ? car.status !== "SOLD" && (
                            <DropdownMenuItem
                              onClick={() =>
                                patchStatus.mutate({
                                  id: car.id,
                                  status: "SOLD",
                                })
                              }
                            >
                              {t("markSold")}
                            </DropdownMenuItem>
                          )
                        : car.status !== "RENTED_OUT" && (
                            <DropdownMenuItem
                              onClick={() =>
                                patchStatus.mutate({
                                  id: car.id,
                                  status: "RENTED_OUT",
                                })
                              }
                            >
                              {t("markRented")}
                            </DropdownMenuItem>
                          )}

                      {(car.status === "SOLD" || car.status === "RENTED_OUT") && (
                        <DropdownMenuItem
                          onClick={() =>
                            patchStatus.mutate({
                              id: car.id,
                              status: "PUBLISHED",
                            })
                          }
                        >
                          {t("markAvailable")}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() =>
                          patchStatus.mutate({
                            id: car.id,
                            isHidden: !car.isHidden,
                          })
                        }
                      >
                        {car.isHidden ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                        {car.isHidden ? t("unhide") : t("hide")}
                      </DropdownMenuItem>

                      {car.harajUrl && (
                        <DropdownMenuItem asChild>
                          <a
                            href={car.harajUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("viewOnHaraj")}
                          </a>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (confirm(t("deleteConfirm"))) remove.mutate(car.id)
                        }}
                      >
                        <Trash2 className="size-4" />
                        {tc("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
