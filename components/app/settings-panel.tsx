"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ImageUploader } from "@/components/app/image-uploader"
import { LinksEditor, type LinkValue } from "@/components/app/links-editor"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/hooks/use-agency"
import { api } from "@/lib/api"
import { CITIES } from "@/lib/constants"
import { showroomUrl } from "@/lib/urls"

export function SettingsPanel() {
  const t = useTranslations("Settings")
  const tc = useTranslations("Common")
  const tOn = useTranslations("Onboarding")
  const tCity = useTranslations("Cities")
  const queryClient = useQueryClient()

  const { data, isPending } = useAgency()
  const [form, setForm] = useState<Record<string, unknown> | null>(null)
  const [links, setLinks] = useState<LinkValue[]>([])

  useEffect(() => {
    if (!data) return
    setForm({
      nameAr: data.agency.nameAr,
      nameEn: data.agency.nameEn,
      locales: data.agency.locales,
      aboutAr: data.agency.aboutAr,
      aboutEn: data.agency.aboutEn,
      city: data.agency.city,
      accentColor: data.agency.accentColor ?? "#1f7a6a",
      logoPath: data.agency.logoPath,
      coverPath: data.agency.coverPath,
    })
    setLinks(
      data.links.map((l) => ({ platform: l.platform, value: l.value })),
    )
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      api("/api/agency/profile", {
        method: "PATCH",
        json: { ...form, links },
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["agency-profile"] })
      void queryClient.invalidateQueries({ queryKey: ["cars"] })
      const demoted = (res as { demoted?: number })?.demoted ?? 0
      if (demoted > 0) {
        toast.warning(t("languageWarningCount", { count: demoted }))
      } else {
        toast.success(t("saved"))
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isPending || !form || !data) return <Skeleton className="h-96 rounded-xl" />

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...(f ?? {}), [key]: value }))

  const locales = (form.locales as string[]) ?? ["ar"]
  const bilingual = locales.includes("en")

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>

      {/* Slug and Haraj username are admin-owned. Shown read-only with the
          reason, so an agency doesn't file a bug about a disabled field. */}
      <section className="border-border/60 space-y-3 rounded-xl border p-5">
        <div className="space-y-2">
          <Label>{t("slug")}</Label>
          <Input dir="ltr" value={showroomUrl(data.agency.slug)} disabled />
          <p className="text-muted-foreground text-xs">{t("slugLocked")}</p>
        </div>
        {data.agency.harajUsername && (
          <div className="space-y-2">
            <Label>{t("harajAccount")}</Label>
            <Input value={data.agency.harajUsername} disabled />
            <p className="text-muted-foreground text-xs">{t("harajLocked")}</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">{t("languages")}</h2>
        <div className="border-border/60 flex items-start justify-between gap-4 rounded-xl border p-4">
          <div>
            <Label htmlFor="bilingual">{tOn("bilingual")}</Label>
            <p className="text-muted-foreground mt-1 text-xs">
              {tOn("languagesHelp")}
            </p>
            {!bilingual && data.wouldDemote > 0 && (
              <p className="text-destructive mt-2 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="size-3.5" />
                {t("languageWarningCount", { count: data.wouldDemote })}
              </p>
            )}
          </div>
          <Switch
            id="bilingual"
            checked={bilingual}
            onCheckedChange={(v) => set("locales", v ? ["ar", "en"] : ["ar"])}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">{t("profile")}</h2>
        <div className="space-y-2">
          <Label>{t("agencyName")}</Label>
          <Input
            dir="rtl"
            value={(form.nameAr as string) ?? ""}
            onChange={(e) => set("nameAr", e.target.value)}
          />
        </div>
        {bilingual && (
          <div className="space-y-2">
            <Label>{tOn("nameEn")}</Label>
            <Input
              dir="ltr"
              value={(form.nameEn as string) ?? ""}
              onChange={(e) => set("nameEn", e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>{tOn("city")}</Label>
          <Select
            value={(form.city as string) ?? ""}
            onValueChange={(v) => set("city", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tOn("city")} />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {tCity(city)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{tOn("aboutAr")}</Label>
          <Textarea
            dir="rtl"
            rows={3}
            value={(form.aboutAr as string) ?? ""}
            onChange={(e) => set("aboutAr", e.target.value)}
          />
        </div>
        {bilingual && (
          <div className="space-y-2">
            <Label>{tOn("aboutEn")}</Label>
            <Textarea
              dir="ltr"
              rows={3}
              value={(form.aboutEn as string) ?? ""}
              onChange={(e) => set("aboutEn", e.target.value)}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">{t("branding")}</h2>
        <div className="space-y-2">
          <Label>{tOn("logo")}</Label>
          <ImageUploader
            kind="branding"
            single
            max={1}
            value={form.logoPath ? [form.logoPath as string] : []}
            onChange={(paths) => set("logoPath", paths[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label>{tOn("cover")}</Label>
          <ImageUploader
            kind="branding"
            single
            max={1}
            value={form.coverPath ? [form.coverPath as string] : []}
            onChange={(paths) => set("coverPath", paths[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accent">{tOn("accentColor")}</Label>
          <div className="flex items-center gap-3">
            <input
              id="accent"
              type="color"
              className="border-border/60 size-10 cursor-pointer rounded-md border"
              value={(form.accentColor as string) ?? "#1f7a6a"}
              onChange={(e) => set("accentColor", e.target.value)}
            />
            <Input
              dir="ltr"
              className="w-32"
              value={(form.accentColor as string) ?? ""}
              onChange={(e) => set("accentColor", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">{t("links")}</h2>
        <LinksEditor value={links} onChange={setLinks} />
      </section>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="size-4 animate-spin" />}
        {tc("save")}
      </Button>
    </div>
  )
}
