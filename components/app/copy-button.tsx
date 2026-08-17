"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const t = useTranslations("Common")
  const [copied, setCopied] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      size={label ? "default" : "icon"}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label && (copied ? t("copied") : label)}
    </Button>
  )
}
