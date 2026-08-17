"use client"

import { cloneElement, useEffect, useId, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ImageUploader } from "@/components/app/image-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useCatalog } from "@/hooks/use-catalog"
import { api } from "@/lib/api"
import {
  BODY_TYPES,
  CITIES,
  CONDITIONS,
  FUELS,
  GEARS,
} from "@/lib/constants"
import { localeName } from "@/lib/format"

const OTHER = "__other"
const NONE = "__none"

export type CarFormValues = {
  listingType: "SALE" | "RENT"
  makeId: string | null
  modelId: string | null
  otherMake: string | null
  otherModel: string | null
  year: number | null
  mileage: number | null
  fuel: string | null
  gear: string | null
  condition: string | null
  bodyType: string | null
  city: string | null
  price: number | null
  rateDaily: number | null
  rateWeekly: number | null
  rateMonthly: number | null
  titleAr: string | null
  titleEn: string | null
  descriptionAr: string | null
  descriptionEn: string | null
  isHidden: boolean
  imagePaths: string[]
}

const EMPTY: CarFormValues = {
  listingType: "SALE",
  makeId: null,
  modelId: null,
  otherMake: null,
  otherModel: null,
  year: null,
  mileage: null,
  fuel: null,
  gear: null,
  condition: null,
  bodyType: null,
  city: null,
  price: null,
  rateDaily: null,
  rateWeekly: null,
  rateMonthly: null,
  titleAr: null,
  titleEn: null,
  descriptionAr: null,
  descriptionEn: null,
  isHidden: false,
  imagePaths: [],
}

export function CarForm({
  carId,
  initial,
  bilingual,
}: {
  carId?: string
  initial?: Partial<CarFormValues>
  bilingual: boolean
}) {
  const t = useTranslations("Cars")
  const tc = useTranslations("Common")
  const tCity = useTranslations("Cities")
  const tBody = useTranslations("BodyTypes")
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [values, setValues] = useState<CarFormValues>({ ...EMPTY, ...initial })
  const { data: catalog } = useCatalog()

  const set = <K extends keyof CarFormValues>(key: K, value: CarFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const makes = catalog?.makes ?? []
  const models = useMemo(
    () => makes.find((m) => m.id === values.makeId)?.models ?? [],
    [makes, values.makeId],
  )

  // Changing the make invalidates whatever model was chosen under the old one.
  useEffect(() => {
    if (values.modelId && !models.some((m) => m.id === values.modelId)) {
      set("modelId", null)
    }
  }, [models]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (payload: CarFormValues) =>
      api(carId ? `/api/agency/cars/${carId}` : "/api/agency/cars", {
        method: carId ? "PATCH" : "POST",
        json: payload,
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["cars"] })
      if ((res as { demoted?: boolean })?.demoted) {
        // Silently leaving a car published-but-incomplete would be worse.
        toast.warning(t("cannotPublish"))
      } else {
        toast.success(tc("save"))
      }
      router.push("/app/dashboard/cars")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isSale = values.listingType === "SALE"

  const num = (v: string) => (v === "" ? null : Number(v))

  return (
    <form
      className="mx-auto max-w-3xl space-y-8"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(values)
      }}
    >
      <section className="space-y-3">
        <Label>{t("listingType")}</Label>
        <Tabs
          value={values.listingType}
          onValueChange={(v) => set("listingType", v as "SALE")}
        >
          <TabsList>
            <TabsTrigger value="SALE">{t("SALE")}</TabsTrigger>
            <TabsTrigger value="RENT">{t("RENT")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="car-make">
            {t("make")} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.makeId ?? (values.otherMake ? OTHER : "")}
            onValueChange={(v) => {
              if (v === OTHER) {
                set("makeId", null)
                set("otherMake", "")
              } else {
                set("makeId", v)
                set("otherMake", null)
              }
            }}
          >
            <SelectTrigger id="car-make" className="w-full">
              <SelectValue placeholder={t("make")} />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {localeName(make, locale)}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>{t("otherOption")}</SelectItem>
            </SelectContent>
          </Select>
          {values.otherMake !== null && (
            <>
              <Input
                value={values.otherMake ?? ""}
                onChange={(e) => set("otherMake", e.target.value)}
                placeholder={t("otherMake")}
              />
              <p className="text-muted-foreground text-xs">{t("otherHelp")}</p>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="car-model">
            {t("model")} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.modelId ?? (values.otherModel !== null ? OTHER : "")}
            onValueChange={(v) => {
              if (v === OTHER) {
                set("modelId", null)
                set("otherModel", "")
              } else {
                set("modelId", v)
                set("otherModel", null)
              }
            }}
            disabled={!values.makeId && values.otherMake === null}
          >
            <SelectTrigger id="car-model" className="w-full">
              <SelectValue placeholder={t("model")} />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {localeName(model, locale)}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>{t("otherOption")}</SelectItem>
            </SelectContent>
          </Select>
          {values.otherModel !== null && (
            <Input
              value={values.otherModel ?? ""}
              onChange={(e) => set("otherModel", e.target.value)}
              placeholder={t("otherModel")}
            />
          )}
        </div>

        <Field label={t("year")}>
          <Input
            type="number"
            inputMode="numeric"
            value={values.year ?? ""}
            onChange={(e) => set("year", num(e.target.value))}
          />
        </Field>

        <Field label={t("mileage")}>
          <Input
            type="number"
            inputMode="numeric"
            value={values.mileage ?? ""}
            onChange={(e) => set("mileage", num(e.target.value))}
          />
        </Field>

        <EnumField
          label={t("gear")}
          value={values.gear}
          options={GEARS}
          render={(v) => t(v)}
          onChange={(v) => set("gear", v)}
          none={tc("none")}
        />
        <EnumField
          label={t("fuel")}
          value={values.fuel}
          options={FUELS}
          render={(v) => t(v)}
          onChange={(v) => set("fuel", v)}
          none={tc("none")}
        />
        <EnumField
          label={t("condition")}
          value={values.condition}
          options={CONDITIONS}
          render={(v) => t(v)}
          onChange={(v) => set("condition", v)}
          none={tc("none")}
        />
        <EnumField
          label={t("bodyType")}
          value={values.bodyType}
          options={BODY_TYPES}
          render={(v) => tBody(v)}
          onChange={(v) => set("bodyType", v)}
          none={tc("none")}
        />
        <EnumField
          label={t("city")}
          value={values.city}
          options={CITIES}
          render={(v) => tCity(v)}
          onChange={(v) => set("city", v)}
          none={tc("none")}
        />
      </section>

      <section className="space-y-4">
        {isSale ? (
          <Field label={t("price")}>
            <Input
              type="number"
              inputMode="numeric"
              value={values.price ?? ""}
              onChange={(e) => set("price", num(e.target.value))}
            />
          </Field>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("rateDaily")}>
                <Input
                  type="number"
                  value={values.rateDaily ?? ""}
                  onChange={(e) => set("rateDaily", num(e.target.value))}
                />
              </Field>
              <Field label={t("rateWeekly")}>
                <Input
                  type="number"
                  value={values.rateWeekly ?? ""}
                  onChange={(e) => set("rateWeekly", num(e.target.value))}
                />
              </Field>
              <Field label={t("rateMonthly")}>
                <Input
                  type="number"
                  value={values.rateMonthly ?? ""}
                  onChange={(e) => set("rateMonthly", num(e.target.value))}
                />
              </Field>
            </div>
            <p className="text-muted-foreground text-xs">{t("ratesHelp")}</p>
          </>
        )}
      </section>

      <section className="space-y-4">
        <Field label={t("titleAr")}>
          <Input
            dir="rtl"
            value={values.titleAr ?? ""}
            onChange={(e) => set("titleAr", e.target.value)}
          />
        </Field>
        <Field label={t("descriptionAr")}>
          <Textarea
            dir="rtl"
            rows={4}
            value={values.descriptionAr ?? ""}
            onChange={(e) => set("descriptionAr", e.target.value)}
          />
        </Field>

        {/* English fields exist only for a bilingual showroom, an Arabic-only
            agency should never see boxes it can safely ignore. */}
        {bilingual && (
          <>
            <Field label={t("titleEn")}>
              <Input
                dir="ltr"
                value={values.titleEn ?? ""}
                onChange={(e) => set("titleEn", e.target.value)}
              />
            </Field>
            <Field label={t("descriptionEn")}>
              <Textarea
                dir="ltr"
                rows={4}
                value={values.descriptionEn ?? ""}
                onChange={(e) => set("descriptionEn", e.target.value)}
              />
            </Field>
          </>
        )}
      </section>

      <section className="space-y-3">
        <Label>{t("images")}</Label>
        <ImageUploader
          value={values.imagePaths}
          onChange={(paths) => set("imagePaths", paths)}
        />
      </section>

      <section className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <Label htmlFor="hidden">{t("hide")}</Label>
          <p className="text-muted-foreground mt-1 text-xs">{t("hiddenHelp")}</p>
        </div>
        <Switch
          id="hidden"
          checked={values.isHidden}
          onCheckedChange={(v) => set("isHidden", v)}
        />
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          {tc("save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/app/dashboard/cars")}
        >
          {tc("cancel")}
        </Button>
      </div>
    </form>
  )
}

/**
 * Generates the id and wires `htmlFor` itself. A bare <Label> next to an <Input>
 * looks right but leaves the field with no accessible name, so screen readers
 * and automation both see an anonymous textbox.
 */
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactElement<{ id?: string }>
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id })}
    </div>
  )
}

function EnumField<T extends string>({
  label,
  value,
  options,
  render,
  onChange,
  none,
}: {
  label: string
  value: string | null
  options: readonly T[]
  // eslint-disable-next-line no-unused-vars
  render: (value: T) => string
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string | null) => void
  none: string
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(v) => onChange(v === NONE ? null : v)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{none}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {render(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
