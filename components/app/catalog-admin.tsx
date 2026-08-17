"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { Check, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { localeName } from "@/lib/format"

type Make = { id: string; code: string; nameAr: string; nameEn: string }
type Model = Make & { makeId: string }
type Request = {
  request: {
    id: string
    makeId: string | null
    makeName: string | null
    modelName: string | null
  }
  agencyName: string
  agencySlug: string
}

export function CatalogAdmin() {
  const t = useTranslations("Admin")
  const tc = useTranslations("Common")
  const tCars = useTranslations("Cars")
  const locale = useLocale()
  const queryClient = useQueryClient()

  const { data, isPending } = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: () =>
      api<{ makes: Make[]; models: Model[]; requests: Request[] }>(
        "/api/admin/catalog",
      ),
  })

  const post = useMutation({
    mutationFn: (json: Record<string, unknown>) =>
      api("/api/admin/catalog", { method: "POST", json }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-catalog"] })
      void queryClient.invalidateQueries({ queryKey: ["catalog"] })
      toast.success(tc("save"))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [makeForm, setMakeForm] = useState({ code: "", nameAr: "", nameEn: "" })
  const [modelForm, setModelForm] = useState({
    makeId: "",
    code: "",
    nameAr: "",
    nameEn: "",
  })

  if (isPending) return <Skeleton className="h-96 rounded-xl" />

  const makes = data?.makes ?? []
  const requests = data?.requests ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("catalogTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("catalogSubtitle")}
        </p>
      </div>

      {/* The queue is the point of the "Other" escape hatch, names agencies
          actually needed, waiting to become real catalog entries. */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t("pendingRequests")}</h2>
        <p className="text-muted-foreground text-xs">
          {t("pendingRequestsHelp")}
        </p>

        {requests.length === 0 ? (
          <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed py-8 text-center text-sm">
            {t("noPending")}
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map(({ request, agencyName }) => (
              <PendingRow
                key={request.id}
                request={request}
                agencyName={agencyName}
                makes={makes}
                locale={locale}
                labels={{
                  approve: t("approve"),
                  reject: t("reject"),
                  requestedBy: t("requestedBy"),
                  make: tCars("make"),
                  model: tCars("model"),
                  code: t("makeCode"),
                }}
                onResolve={(json) => post.mutate(json)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t("addMake")}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            placeholder={t("makeCode")}
            dir="ltr"
            value={makeForm.code}
            onChange={(e) =>
              setMakeForm((f) => ({
                ...f,
                code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
              }))
            }
          />
          <Input
            placeholder="Name (EN)"
            dir="ltr"
            value={makeForm.nameEn}
            onChange={(e) => setMakeForm((f) => ({ ...f, nameEn: e.target.value }))}
          />
          <Input
            placeholder="الاسم (عربي)"
            dir="rtl"
            value={makeForm.nameAr}
            onChange={(e) => setMakeForm((f) => ({ ...f, nameAr: e.target.value }))}
          />
          <Button
            onClick={() => post.mutate({ action: "addMake", ...makeForm })}
            disabled={!makeForm.code || !makeForm.nameAr || !makeForm.nameEn}
          >
            <Plus className="size-4" />
            {tc("add")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t("addModel")}</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <Select
            value={modelForm.makeId}
            onValueChange={(v) => setModelForm((f) => ({ ...f, makeId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={tCars("make")} />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {localeName(make, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t("makeCode")}
            dir="ltr"
            value={modelForm.code}
            onChange={(e) =>
              setModelForm((f) => ({
                ...f,
                code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
              }))
            }
          />
          <Input
            placeholder="Name (EN)"
            dir="ltr"
            value={modelForm.nameEn}
            onChange={(e) =>
              setModelForm((f) => ({ ...f, nameEn: e.target.value }))
            }
          />
          <Input
            placeholder="الاسم (عربي)"
            dir="rtl"
            value={modelForm.nameAr}
            onChange={(e) =>
              setModelForm((f) => ({ ...f, nameAr: e.target.value }))
            }
          />
          <Button
            onClick={() => post.mutate({ action: "addModel", ...modelForm })}
            disabled={
              !modelForm.makeId ||
              !modelForm.code ||
              !modelForm.nameAr ||
              !modelForm.nameEn
            }
          >
            <Plus className="size-4" />
            {tc("add")}
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">
          {tCars("make")} ({makes.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {makes.map((make) => (
            <Badge key={make.id} variant="outline">
              {localeName(make, locale)}
              <span className="text-muted-foreground ms-1.5 text-xs">
                {data?.models.filter((m) => m.makeId === make.id).length}
              </span>
            </Badge>
          ))}
        </div>
      </section>
    </div>
  )
}

function PendingRow({
  request,
  agencyName,
  makes,
  locale,
  labels,
  onResolve,
}: {
  request: Request["request"]
  agencyName: string
  makes: Make[]
  locale: string
  labels: Record<
    "approve" | "reject" | "requestedBy" | "make" | "model" | "code",
    string
  >
  // eslint-disable-next-line no-unused-vars
  onResolve: (json: Record<string, unknown>) => void
}) {
  const isModel = !!request.modelName
  const suggested = (request.modelName ?? request.makeName ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .slice(0, 40)

  const [code, setCode] = useState(suggested)
  const [nameEn, setNameEn] = useState(request.modelName ?? request.makeName ?? "")
  const [nameAr, setNameAr] = useState(request.modelName ?? request.makeName ?? "")
  const [makeId, setMakeId] = useState(request.makeId ?? "")

  return (
    <div className="border-border/60 bg-card space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{isModel ? labels.model : labels.make}</Badge>
        <span className="font-medium">
          {request.modelName ?? request.makeName}
        </span>
        <span className="text-muted-foreground text-xs">
          {labels.requestedBy}: {agencyName}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {isModel && (
          <Select value={makeId} onValueChange={setMakeId}>
            <SelectTrigger size="sm">
              <SelectValue placeholder={labels.make} />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {localeName(make, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          className="h-9"
          dir="ltr"
          placeholder={labels.code}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Input
          className="h-9"
          dir="ltr"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
        <Input
          className="h-9"
          dir="rtl"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!code || !nameAr || !nameEn || (isModel && !makeId)}
          onClick={() =>
            onResolve({
              action: "resolveRequest",
              id: request.id,
              approve: true,
              makeId: isModel ? makeId : null,
              code,
              nameAr,
              nameEn,
            })
          }
        >
          <Check className="size-4" />
          {labels.approve}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onResolve({
              action: "resolveRequest",
              id: request.id,
              approve: false,
            })
          }
        >
          <X className="size-4" />
          {labels.reject}
        </Button>
      </div>
    </div>
  )
}
