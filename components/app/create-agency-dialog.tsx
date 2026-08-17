"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { showroomUrl, slugify } from "@/lib/urls"

/** Mirrors lib/ids.generatePassword, ambiguous glyphs excluded on purpose. */
function suggestPassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

export function CreateAgencyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line no-unused-vars
  onCreated: (creds: { email: string; password: string; url: string }) => void
}) {
  const t = useTranslations("Admin")
  const tc = useTranslations("Common")

  const [nameAr, setNameAr] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState(suggestPassword)
  const [harajUsername, setHarajUsername] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)

  const create = useMutation({
    mutationFn: () =>
      api("/api/admin/agencies", {
        method: "POST",
        json: {
          nameAr,
          nameEn: nameEn || undefined,
          slug,
          email,
          password,
          harajUsername: harajUsername || undefined,
        },
      }),
    onSuccess: () => {
      onCreated({ email, password, url: showroomUrl(slug) })
      onOpenChange(false)
      setNameAr("")
      setNameEn("")
      setSlug("")
      setEmail("")
      setHarajUsername("")
      setPassword(suggestPassword())
      setSlugTouched(false)
    },
    onError: (err: Error) => {
      const map: Record<string, string> = {
        "slug:taken": t("slugTaken"),
        "slug:reserved": t("slugReserved"),
        "slug:format": t("slugFormat"),
        "email:taken": t("email"),
      }
      toast.error(map[err.message] ?? err.message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createAgency")}</DialogTitle>
          <DialogDescription>{t("credentialsHelp")}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ca-name-ar">{t("agencyNameAr")}</Label>
            <Input
              id="ca-name-ar"
              dir="rtl"
              required
              value={nameAr}
              onChange={(e) => {
                setNameAr(e.target.value)
                // Arabic names produce no usable slug, so this only helps when
                // the admin types a Latin name, never fights their own input.
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ca-name-en">{t("agencyNameEn")}</Label>
            <Input
              id="ca-name-en"
              dir="ltr"
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value)
                if (!slugTouched && !slug) setSlug(slugify(e.target.value))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ca-slug">{t("slug")}</Label>
            <Input
              id="ca-slug"
              dir="ltr"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
            />
            <p className="text-muted-foreground text-xs" dir="ltr">
              {t("slugHelp", { example: showroomUrl(slug || "agency") })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ca-email">{t("email")}</Label>
            <Input
              id="ca-email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ca-password">{t("password")}</Label>
            <div className="flex gap-2">
              <Input
                id="ca-password"
                dir="ltr"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassword(suggestPassword())}
                aria-label={t("generatePassword")}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ca-haraj">{t("harajUsername")}</Label>
            <Input
              id="ca-haraj"
              value={harajUsername}
              onChange={(e) => setHarajUsername(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t("harajHelp")}</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("createAgency")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
