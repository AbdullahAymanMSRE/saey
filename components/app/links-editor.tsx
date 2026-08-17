"use client"

import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LINK_PLATFORMS, PHONE_PLATFORMS, type LinkPlatform } from "@/lib/constants"

export type LinkValue = { platform: LinkPlatform; value: string }

/**
 * A fixed set of platforms rather than free-form rows: each gets its own icon on
 * the showroom and its own validation, and a consistent contact strip is part of
 * what keeps every showroom looking finished.
 */
export function LinksEditor({
  value,
  onChange,
}: {
  value: LinkValue[]
  // eslint-disable-next-line no-unused-vars
  onChange: (links: LinkValue[]) => void
}) {
  const t = useTranslations("Links")

  const set = (platform: LinkPlatform, raw: string) => {
    const rest = value.filter((l) => l.platform !== platform)
    onChange(raw.trim() ? [...rest, { platform, value: raw }] : rest)
  }

  const get = (platform: LinkPlatform) =>
    value.find((l) => l.platform === platform)?.value ?? ""

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LINK_PLATFORMS.map((platform) => {
        const isPhone = PHONE_PLATFORMS.includes(platform)
        return (
          <div key={platform} className="space-y-2">
            <Label htmlFor={platform}>{t(platform)}</Label>
            <Input
              id={platform}
              dir="ltr"
              inputMode={isPhone ? "tel" : "url"}
              placeholder={
                isPhone
                  ? t("phonePlaceholder")
                  : platform === "SNAPCHAT"
                    ? t("handlePlaceholder")
                    : t("urlPlaceholder")
              }
              value={get(platform)}
              onChange={(e) => set(platform, e.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
