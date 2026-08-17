"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Check, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { CITIES } from "@/lib/constants"
import { cn } from "@/lib/utils"

const STEPS = ["stepPassword", "stepLanguages", "stepBranding", "stepContact"] as const

export function OnboardingWizard({ slug }: { slug: string }) {
  const t = useTranslations("Onboarding")
  const tAuth = useTranslations("Auth")
  const tc = useTranslations("Common")
  const tCity = useTranslations("Cities")
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [bilingual, setBilingual] = useState(false)
  const [nameEn, setNameEn] = useState("")
  const [city, setCity] = useState<string | undefined>()
  const [aboutAr, setAboutAr] = useState("")
  const [aboutEn, setAboutEn] = useState("")
  const [accentColor, setAccentColor] = useState("#1f7a6a")
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [coverPath, setCoverPath] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkValue[]>([])

  const finish = useMutation({
    mutationFn: () =>
      api("/api/agency/onboarding", {
        method: "POST",
        json: {
          password,
          locales: bilingual ? ["ar", "en"] : ["ar"],
          nameEn: nameEn || undefined,
          city,
          aboutAr: aboutAr || undefined,
          aboutEn: aboutEn || undefined,
          accentColor,
          logoPath,
          coverPath,
          links,
        },
      }),
    onSuccess: () => {
      router.replace("/app/dashboard")
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const passwordValid = password.length >= 8 && password === confirm

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <nav className="mt-5 flex gap-2">
          {STEPS.map((key, i) => (
            <div key={key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary border-2"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  i === step ? "font-medium" : "text-muted-foreground",
                )}
              >
                {t(key)}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">{tAuth("changePasswordTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {tAuth("changePasswordSubtitle")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{tAuth("newPassword")}</Label>
            <Input
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-destructive text-xs">{tAuth("tooShort")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{tAuth("confirmPassword")}</Label>
            <Input
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && confirm !== password && (
              <p className="text-destructive text-xs">{tAuth("mismatch")}</p>
            )}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">{t("languagesTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("languagesHelp")}
            </p>
          </div>

          {/* This choice changes what every car needs before it can go live, so
              it is a deliberate decision here rather than a toggle buried later. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={!bilingual}
              onSelect={() => setBilingual(false)}
              title={t("arabicOnly")}
              body={t("arabicOnlyHelp")}
            />
            <ChoiceCard
              selected={bilingual}
              onSelect={() => setBilingual(true)}
              title={t("bilingual")}
              body={t("bilingualHelp")}
            />
          </div>

          {bilingual && (
            <div className="space-y-2">
              <Label>{t("nameEn")}</Label>
              <Input
                dir="ltr"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <h2 className="font-medium">{t("brandingTitle")}</h2>

          <div className="space-y-2">
            <Label>{t("logo")}</Label>
            <ImageUploader
              kind="branding"
              single
              max={1}
              value={logoPath ? [logoPath] : []}
              onChange={(p) => setLogoPath(p[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("cover")}</Label>
            <ImageUploader
              kind="branding"
              single
              max={1}
              value={coverPath ? [coverPath] : []}
              onChange={(p) => setCoverPath(p[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent">{t("accentColor")}</Label>
            <input
              id="accent"
              type="color"
              className="border-border/60 size-10 cursor-pointer rounded-md border"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("city")} />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {tCity(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("aboutAr")}</Label>
            <Textarea
              dir="rtl"
              rows={3}
              value={aboutAr}
              onChange={(e) => setAboutAr(e.target.value)}
            />
          </div>

          {bilingual && (
            <div className="space-y-2">
              <Label>{t("aboutEn")}</Label>
              <Textarea
                dir="ltr"
                rows={3}
                value={aboutEn}
                onChange={(e) => setAboutEn(e.target.value)}
              />
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">{t("contactTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("contactHelp")}
            </p>
          </div>
          <LinksEditor value={links} onChange={setLinks} />
          <p className="text-muted-foreground text-xs" dir="ltr">
            {slug}
          </p>
        </section>
      )}

      <div className="flex justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          {tc("back")}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !passwordValid}
          >
            {tc("next")}
          </Button>
        ) : (
          <Button
            onClick={() => finish.mutate()}
            disabled={finish.isPending || !passwordValid}
          >
            {finish.isPending && <Loader2 className="size-4 animate-spin" />}
            {tc("finish")}
          </Button>
        )}
      </div>
    </div>
  )
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  body: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-4 text-start transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:bg-accent",
      )}
    >
      <span className="font-medium">{title}</span>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{body}</p>
    </button>
  )
}
