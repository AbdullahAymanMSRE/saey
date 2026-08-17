"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useFormatter, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  MoreHorizontal,
  Plus,
  UserRoundCog,
} from "lucide-react"
import { toast } from "sonner"

import { CopyButton } from "@/components/app/copy-button"
import { CreateAgencyDialog } from "@/components/app/create-agency-dialog"
import { CredentialsDialog } from "@/components/app/credentials-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { showroomUrl } from "@/lib/urls"

type AgencyRow = {
  id: string
  slug: string
  nameAr: string
  nameEn: string | null
  email: string
  suspended: boolean
  harajUsername: string | null
  carCount: number
  createdAt: string
}

export function AgenciesAdmin() {
  const t = useTranslations("Admin")
  const tc = useTranslations("Common")
  const format = useFormatter()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState<{
    email: string
    password: string
    url: string
  } | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: () => api<{ agencies: AgencyRow[] }>("/api/admin/agencies"),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-agencies"] })

  const setSuspended = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api(`/api/admin/agencies/${id}`, {
        method: "PATCH",
        json: { suspended },
      }),
    onSuccess: () => {
      invalidate()
      toast.success(tc("save"))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resetPassword = useMutation({
    mutationFn: (agency: AgencyRow) =>
      api<{ password: string }>(`/api/admin/agencies/${agency.id}/password`, {
        method: "POST",
      }).then((res) => ({ ...res, agency })),
    onSuccess: ({ password, agency }) =>
      // Shown once and never recoverable, so it goes straight into the dialog
      // the admin copies from.
      setCredentials({
        email: agency.email,
        password,
        url: showroomUrl(agency.slug),
      }),
    onError: (err: Error) => toast.error(err.message),
  })

  const impersonate = useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/agencies/${id}/impersonate`, { method: "POST" }),
    onSuccess: () => {
      router.push("/app/dashboard")
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const agencies = data?.agencies ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-xl font-semibold tracking-tight">
          {t("agencies")}
        </h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t("newAgency")}
        </Button>
      </div>

      {isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : agencies.length === 0 ? (
        <div className="border-border/60 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">{t("noAgencies")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="border-border/60 bg-card flex flex-wrap items-center gap-4 rounded-lg border p-4"
            >
              <div className="min-w-40 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{agency.nameAr}</span>
                  <Badge variant={agency.suspended ? "destructive" : "secondary"}>
                    {agency.suspended ? t("suspended") : t("active")}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs" dir="ltr">
                  /{agency.slug} · {agency.email}
                  {agency.harajUsername && ` · haraj: ${agency.harajUsername}`}
                </p>
              </div>

              <div className="text-muted-foreground text-xs">
                {t("carsCount")}: {agency.carCount}
                {" · "}
                {format.dateTime(new Date(agency.createdAt), {
                  dateStyle: "medium",
                })}
              </div>

              <div className="flex items-center gap-1">
                <CopyButton value={showroomUrl(agency.slug)} />
                <Button asChild size="icon" variant="ghost">
                  <a
                    href={`/${agency.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm(t("resetPasswordConfirm", { name: agency.nameAr })))
                          resetPassword.mutate(agency)
                      }}
                    >
                      <KeyRound className="size-4" />
                      {t("resetPassword")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => impersonate.mutate(agency.id)}
                    >
                      <UserRoundCog className="size-4" />
                      {t("impersonate")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {agency.suspended ? (
                      <DropdownMenuItem
                        onClick={() =>
                          setSuspended.mutate({
                            id: agency.id,
                            suspended: false,
                          })
                        }
                      >
                        <CheckCircle2 className="size-4" />
                        {t("unsuspend")}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (confirm(t("suspendConfirm", { name: agency.nameAr })))
                            setSuspended.mutate({
                              id: agency.id,
                              suspended: true,
                            })
                        }}
                      >
                        <Ban className="size-4" />
                        {t("suspend")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAgencyDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(creds) => {
          invalidate()
          setCredentials(creds)
        }}
      />

      <CredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  )
}
