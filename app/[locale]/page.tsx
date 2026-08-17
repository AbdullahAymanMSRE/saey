import { setRequestLocale } from "next-intl/server"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Download,
  Languages,
  QrCode,
  Store,
  Tags,
} from "lucide-react"
import { use } from "react"

import { LocaleSwitcher } from "@/components/showroom/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { isRtl } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  const t = useTranslations("Landing")
  const tc = useTranslations("Common")
  const rtl = isRtl(locale)
  const Arrow = rtl ? ArrowLeft : ArrowRight

  const features = [
    { icon: Store, title: t("featureShowroomTitle"), body: t("featureShowroomBody") },
    { icon: QrCode, title: t("featureQrTitle"), body: t("featureQrBody") },
    { icon: BarChart3, title: t("featureStatsTitle"), body: t("featureStatsBody") },
    { icon: Download, title: t("featureImportTitle"), body: t("featureImportBody") },
    { icon: Tags, title: t("featureBothTitle"), body: t("featureBothBody") },
    { icon: BadgeCheck, title: t("featureSoldTitle"), body: t("featureSoldBody") },
  ]

  const steps = [
    { title: t("how1Title"), body: t("how1Body") },
    { title: t("how2Title"), body: t("how2Body") },
    { title: t("how3Title"), body: t("how3Body") },
  ]

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ]

  return (
    <div className="bg-background relative min-h-dvh overflow-x-hidden">
      {/* ---------------------------------------------------------------- nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-2xl font-semibold tracking-tight">
          {tc("appName")}
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          <Button asChild size="lg" className="hidden text-base sm:inline-flex">
            <Link href="/app/login">{t("navSignIn")}</Link>
          </Button>
        </div>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="bg-bloom bg-grain relative isolate overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10" aria-hidden />

        <div className="mx-auto w-full max-w-6xl px-5 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <p
            className="rise text-primary text-sm font-medium tracking-wide sm:text-base"
            style={{ animationDelay: "0ms" }}
          >
            {t("eyebrow")}
          </p>

          {/* Leading is locale-specific and must be. Arabic needs more room than
              Latin at display sizes, and the exact value is tied to the face:
              these were retuned when the type changed to Cairo. */}
          <h1
            className={cn(
              "font-display mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl lg:text-8xl",
              rtl
                ? "leading-[1.25] sm:leading-[1.18]"
                : "leading-[1.05] sm:leading-[0.98]",
            )}
          >
            <span
              className="rise block"
              style={{ animationDelay: "60ms" }}
            >
              {t("titleLine1")}
            </span>
            <span
              className="rise text-primary block"
              style={{ animationDelay: "140ms" }}
            >
              {t("titleLine2")}
            </span>
          </h1>

          <p
            className="rise text-muted-foreground mt-8 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl"
            style={{ animationDelay: "220ms" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href="/app/login">
                {t("ctaPrimary")}
                <Arrow className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
            >
              <a href="#how">{t("ctaSecondary")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- stats */}
      <section className="border-border/60 border-y">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat value="41" label={t("statMakes")} />
          <Stat value="2" label={t("statLanguages")} />
          <Stat value="1" label={t("statQr")} />
        </div>
      </section>

      {/* ----------------------------------------------------------- features */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
        <h2 className={cn("font-display reveal max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
          {t("featuresTitle")}
        </h2>

        <div className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => (
            <article
              key={title}
              className="reveal border-border/60 bg-card hover:bg-accent/40 group relative border p-7 transition-colors"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="bg-primary/10 text-primary mb-5 grid size-11 place-items-center rounded-xl">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2.5 leading-relaxed">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- how */}
      <section id="how" className="border-border/60 border-y scroll-mt-8">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
          <h2 className={cn("font-display reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
            {t("howTitle")}
          </h2>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="reveal relative"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="border-border/60 mb-5 flex items-center gap-4 border-t pt-5">
                  <span className="font-display text-primary text-5xl leading-none font-light tabular-nums">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2.5 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- haraj */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="reveal">
            <p className="text-primary text-sm font-medium tracking-wide">
              {t("harajEyebrow")}
            </p>
            <h2 className={cn("font-display mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
              {t("harajTitle")}
            </h2>
            <p className="text-muted-foreground mt-6 text-lg leading-relaxed text-pretty">
              {t("harajBody")}
            </p>
          </div>

          {/* Deliberately shows the messy source next to the clean result: the
              value of the import is the transformation, not the transfer. */}
          <div className="reveal grid gap-4 sm:grid-cols-2">
            <div className="border-border/60 bg-muted/40 rounded-2xl border border-dashed p-5">
              <p className="text-muted-foreground text-xs font-medium">
                {t("harajBefore")}
              </p>
              <p className="mt-4 text-sm leading-relaxed" dir="rtl">
                كامري 2007 ماشي نظيفه ماشاء الله بدون حوادث السعر 12000 للجادين
                فقط الرياض
              </p>
            </div>

            <div className="border-border/60 bg-card rounded-2xl border p-5 shadow-sm">
              <p className="text-muted-foreground text-xs font-medium">
                {t("harajAfter")}
              </p>
              <div className="bg-muted mt-4 aspect-[4/3] rounded-lg" />
              <p className="font-display mt-3 font-semibold">
                {locale === "ar" ? "تويوتا كامري 2007" : "Toyota Camry 2007"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {locale === "ar" ? "12,000 ريال" : "12,000 SAR"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- bilingual */}
      <section className="border-border/60 border-y">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
          <div className="reveal mx-auto max-w-3xl text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-6 grid size-12 place-items-center rounded-xl">
              <Languages className="size-5" />
            </div>
            <p className="text-primary text-sm font-medium tracking-wide">
              {t("langEyebrow")}
            </p>
            <h2 className={cn("font-display mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
              {t("langTitle")}
            </h2>
            <p className="text-muted-foreground mt-6 text-lg leading-relaxed text-pretty">
              {t("langBody")}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- faq */}
      <section className="mx-auto w-full max-w-3xl px-5 py-24 sm:py-32">
        <h2 className={cn("font-display reveal text-3xl font-semibold tracking-tight sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
          {t("faqTitle")}
        </h2>

        <div className="mt-12 divide-y">
          {faqs.map(({ q, a }) => (
            /* <details> keeps this interactive with zero JavaScript. */
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {q}
                <span className="text-muted-foreground shrink-0 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground mt-3 leading-relaxed text-pretty">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta */}
      <section className="border-border/60 border-t">
        <div className="bg-bloom relative isolate mx-auto w-full max-w-6xl overflow-hidden px-5 py-24 text-center sm:py-32">
          <h2 className={cn("font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl", rtl ? "leading-[1.3]" : "leading-tight")}>
            {t("ctaTitle")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg">
            {t("ctaBody")}
          </p>
          <Button asChild size="lg" className="mt-9 h-12 px-8 text-base">
            <Link href="/app/login">
              {t("ctaPrimary")}
              <Arrow className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------- footer */}
      <footer className="border-border/60 border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-foreground text-lg font-semibold">
            {tc("appName")}
          </span>
          <span>{t("footerTagline")}</span>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={cn("px-5 py-10 text-center sm:py-12")}>
      <p className="font-display text-primary text-5xl font-light tabular-nums sm:text-6xl">
        {value}
      </p>
      <p className="text-muted-foreground mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed">
        {label}
      </p>
    </div>
  )
}
