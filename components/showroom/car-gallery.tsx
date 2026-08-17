"use client"

import { useState } from "react"

import { imageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"

export function CarGallery({
  images,
  alt,
}: {
  images: { id: string; path: string }[]
  alt: string
}) {
  const [active, setActive] = useState(0)
  if (!images.length) return null

  return (
    <div className="space-y-3">
      <div className="bg-muted overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(images[active].path, "full")}
          alt={alt}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              className={cn(
                "bg-muted size-16 shrink-0 overflow-hidden rounded-lg ring-offset-2 transition",
                i === active ? "ring-primary ring-2" : "opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(image.path, "thumb")}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
