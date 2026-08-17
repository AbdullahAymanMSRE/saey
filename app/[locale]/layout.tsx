import type { Metadata } from "next"
import { Cairo, Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"
import { localeDirection, routing, type AppLocale } from "@/i18n/routing"

import "../globals.css"

/**
 * Cairo covers Arabic and Latin in one family, so an Arabic showroom with an
 * English model name in the title renders in a single typeface instead of
 * falling back mid-sentence. It is a variable font, so every weight below costs
 * nothing extra.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-arabic",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: "Common" })
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("tagline"),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const dir = localeDirection[locale as AppLocale]

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(cairo.variable, inter.variable)}
    >
      <body
        className={cn(
          "bg-background text-foreground min-h-dvh antialiased",
          locale === "ar" ? "font-[family-name:var(--font-arabic)]" : "font-sans",
        )}
      >
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
