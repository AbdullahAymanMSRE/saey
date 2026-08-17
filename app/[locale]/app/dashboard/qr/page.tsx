import { getTranslations } from "next-intl/server"
import { ExternalLink } from "lucide-react"

import { CopyButton } from "@/components/app/copy-button"
import { Button } from "@/components/ui/button"
import { requireAgency } from "@/lib/session"
import { showroomUrl } from "@/lib/urls"

export default async function QrPage() {
  const { agency } = await requireAgency()
  const t = await getTranslations("Qr")

  const url = showroomUrl(agency.slug)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="border-border/60 bg-card flex flex-col items-center gap-5 rounded-xl border p-6">
        {/* Rendered from the same endpoint the downloads use, so what an agency
            sees is byte-for-byte what they print. */}
        <img
          src={`/api/qr/${agency.slug}`}
          alt={url}
          width={240}
          height={240}
          className="rounded-lg bg-white p-3"
        />

        <div className="w-full space-y-2">
          <p className="text-muted-foreground text-xs">{t("url")}</p>
          <div className="flex gap-2">
            <code
              dir="ltr"
              className="bg-muted flex-1 truncate rounded-md px-3 py-2 text-sm"
            >
              {url}
            </code>
            <CopyButton value={url} />
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2">
          <Button asChild variant="outline" className="flex-1">
            <a href={`/api/qr/${agency.slug}?download=1`} download>
              {t("downloadSvg")}
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <a href={`/api/qr/${agency.slug}?format=png`} download>
              {t("downloadPng")}
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={`/${agency.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              {t("openShowroom")}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
