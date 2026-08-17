"use client"

import { useTranslations } from "next-intl"

import { CopyButton } from "@/components/app/copy-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type Credentials = { email: string; password: string; url: string }

/**
 * The one moment the password is readable. There is no email delivery by design
 *, the admin copies this and sends it over WhatsApp, so the dialog is blunt
 * about the fact that closing it loses the password for good.
 */
export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials | null
  onClose: () => void
}) {
  const t = useTranslations("Admin")
  const tAuth = useTranslations("Auth")
  const tc = useTranslations("Common")

  if (!credentials) return null

  const summary = [
    `${tAuth("email")}: ${credentials.email}`,
    `${tAuth("password")}: ${credentials.password}`,
    `${t("slug")}: ${credentials.url}`,
  ].join("\n")

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("credentialsTitle")}</DialogTitle>
          <DialogDescription>{t("credentialsHelp")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Row label={tAuth("email")} value={credentials.email} />
          <Row label={tAuth("password")} value={credentials.password} mono />
          <Row label={t("slug")} value={credentials.url} />
        </div>

        <DialogFooter className="sm:justify-between">
          <CopyButton value={summary} label={t("copyAll")} />
          <Button onClick={onClose}>{tc("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex min-w-0 gap-2">
        <code
          dir="ltr"
          className={`flex-1 overflow-auto rounded-md bg-muted px-3 py-2 text-sm ${mono ? "font-mono tracking-wide" : ""}`}
        >
          {value}
        </code>
        <CopyButton value={value} />
      </div>
    </div>
  )
}
