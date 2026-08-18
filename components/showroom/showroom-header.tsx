import { getTranslations } from "next-intl/server"
import { Ghost, Globe, MapPin, Phone } from "lucide-react"

import {
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  XIcon,
} from "@/components/showroom/brand-icons"
import { LocaleSwitcher } from "@/components/showroom/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { LinkPlatform } from "@/lib/constants"
import type { ShowroomAgency } from "@/lib/showroom"
import { imageUrl } from "@/lib/image-url"
import { whatsappUrl } from "@/lib/urls"
import { cn } from "@/lib/utils"

const ICONS: Record<LinkPlatform, React.ComponentType<{ className?: string }>> = {
  WHATSAPP: WhatsappIcon,
  PHONE: Phone,
  SNAPCHAT: Ghost,
  INSTAGRAM: InstagramIcon,
  TIKTOK: TiktokIcon,
  X: XIcon,
  WEBSITE: Globe,
  MAPS: MapPin,
}

function linkHref(platform: LinkPlatform, value: string) {
  switch (platform) {
    case "WHATSAPP":
      return whatsappUrl(value)
    case "PHONE":
      return `tel:${value.replace(/\s/g, "")}`
    case "SNAPCHAT":
      return value.startsWith("http")
        ? value
        : `https://snapchat.com/add/${value.replace(/^@/, "")}`
    default:
      return value
  }
}

export async function ShowroomHeader({
  agency,
  locale,
}: {
  agency: ShowroomAgency
  locale: string
}) {
  const t = await getTranslations("Links")
  const name = (locale === "en" && agency.nameEn) || agency.nameAr
  const about = locale === "en" ? (agency.aboutEn ?? agency.aboutAr) : agency.aboutAr
  // The switcher only exists on a showroom that actually has two languages.
  const bilingual = agency.locales.includes("en")

  return (
    <header className="border-border/60 border-b">
      {/* Shorter without a cover: a tall empty grey band reads as a broken
          image rather than as a deliberately plain header. */}
      <div
        className={cn(
          "bg-muted relative w-full",
          agency.coverPath ? "h-40 sm:h-56" : "h-20 sm:h-24",
        )}
      >
        {agency.coverPath && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl(agency.coverPath, "full")}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute top-4 end-4 flex items-center gap-2">
          <ThemeToggle className="bg-background/80 shadow-sm backdrop-blur" />
          {bilingual && <LocaleSwitcher slug={agency.slug} />}
        </div>
      </div>

      {/* `relative` keeps this above the cover: the cover wrapper is positioned,
          so static content after it would paint underneath. Only the avatar is
          pulled up into the cover — the title has to clear it. */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="border-background -mt-10 size-20 shrink-0 border-4 shadow-sm sm:-mt-12 sm:size-24">
            {agency.logoPath && (
              <AvatarImage src={imageUrl(agency.logoPath, "thumb")} alt={name} />
            )}
            <AvatarFallback className="text-xl font-semibold">
              {name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 sm:pt-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {name}
            </h1>
            {about && (
              <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {about}
              </p>
            )}
          </div>
        </div>

        {agency.links.length > 0 && (
          <nav className="mt-4 flex flex-wrap gap-2">
            {agency.links.map((link) => {
              const Icon = ICONS[link.platform]
              return (
                <a
                  key={link.id}
                  href={linkHref(link.platform, link.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border/60 hover:bg-accent inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors"
                >
                  <Icon className="size-4" />
                  {t(link.platform)}
                </a>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
