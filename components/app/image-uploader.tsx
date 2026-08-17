"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ImagePlus, Loader2, Star, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { MAX_IMAGES_PER_CAR } from "@/lib/constants"
import { imageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"

/**
 * Uploads go straight to the volume and come back as keys; the form only ever
 * holds an ordered list of those keys. Reordering is therefore free, and a car
 * that is never saved leaves files behind rather than a broken half-record.
 */
export function ImageUploader({
  value,
  onChange,
  kind = "cars",
  max = MAX_IMAGES_PER_CAR,
  single,
}: {
  value: string[]
  onChange: (paths: string[]) => void
  kind?: "cars" | "branding"
  max?: number
  single?: boolean
}) {
  const t = useTranslations("Cars")
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      const form = new FormData()
      form.set("kind", kind)
      Array.from(files)
        .slice(0, max - value.length)
        .forEach((file) => form.append("files", file))

      const res = await fetch("/api/upload", { method: "POST", body: form })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? "Upload failed")

      const paths = (body.images as { path: string }[]).map((i) => i.path)
      onChange(single ? paths.slice(0, 1) : [...value, ...paths].slice(0, max))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ""
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((path, i) => (
          <div
            key={path}
            className={cn(
              "group border-border/60 relative size-24 overflow-hidden rounded-lg border",
              i === 0 && !single && "ring-primary ring-2 ring-offset-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(path, "thumb")}
              alt=""
              className="h-full w-full object-cover"
            />

            <button
              type="button"
              onClick={() => onChange(value.filter((p) => p !== path))}
              className="bg-background/90 absolute top-1 end-1 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label="remove"
            >
              <X className="size-3" />
            </button>

            {/* One tap to make a photo the cover, the common case by far. */}
            {!single && i !== 0 && (
              <button
                type="button"
                onClick={() => move(i, 0)}
                className="bg-background/90 absolute bottom-1 start-1 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label="make cover"
              >
                <Star className="size-3" />
              </button>
            )}
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="border-border/60 text-muted-foreground hover:border-primary hover:text-foreground grid size-24 place-items-center rounded-lg border border-dashed transition-colors"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </button>
        )}
      </div>

      {!single && value.length > 1 && (
        <p className="text-muted-foreground text-xs">{t("imagesHelp")}</p>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={!single}
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => input.current?.click()}
        disabled={uploading || value.length >= max}
      >
        <ImagePlus className="size-4" />
        {t("addPhotos")}
      </Button>
    </div>
  )
}
