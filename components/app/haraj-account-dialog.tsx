"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
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
import { normalizeHarajUsername } from "@/lib/urls"

export type HarajTarget = {
  id: string
  nameAr: string
  harajUsername: string | null
}

/**
 * Sets or changes an agency's Haraj account after it has been created.
 *
 * Kept out of the agency's own settings on purpose: this field is the only
 * control preventing one agency importing a competitor's inventory, so it stays
 * admin-owned for the life of the account.
 */
export function HarajAccountDialog({
  agency,
  onClose,
}: {
  agency: HarajTarget | null
  onClose: () => void
}) {
  const t = useTranslations("Admin")
  const tc = useTranslations("Common")
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")

  useEffect(() => {
    setValue(agency?.harajUsername ?? "")
  }, [agency])

  const save = useMutation({
    mutationFn: (harajUsername: string | null) =>
      api(`/api/admin/agencies/${agency!.id}`, {
        method: "PATCH",
        json: { harajUsername },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-agencies"] })
      toast.success(t("setHarajSaved"))
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!agency) return null

  // Shown live so the admin can see a pasted URL resolve to the name the
  // importer will actually query, before they commit to it.
  const resolved = normalizeHarajUsername(value)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("setHarajTitle")}</DialogTitle>
          <DialogDescription>{agency.nameAr}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate(resolved || null)
          }}
        >
          <Label htmlFor="haraj-account">{t("harajUsername")}</Label>
          <Input
            id="haraj-account"
            dir="ltr"
            autoFocus
            placeholder={t("harajPlaceholder")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          {resolved ? (
            <p className="text-muted-foreground text-sm" dir="auto">
              {t("harajResolved", { name: resolved })}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">{t("harajNone")}</p>
          )}

          <p className="text-muted-foreground pt-1 text-xs">{t("harajHelp")}</p>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
