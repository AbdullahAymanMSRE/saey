"use client"

import { useTranslations } from "next-intl"
import { MessageCircle, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The conversion surface of the whole product.
 *
 * WhatsApp leads because that is how a Saudi car sale actually starts, and the
 * message arrives pre-written with the car and its link so the agency knows what
 * the enquiry is about without asking. The tap is recorded as a contact event ,
 * it is the closest thing to a real outcome the dashboard can show.
 */
export function ContactCta({
  agencyId,
  carId,
  whatsapp,
  phone,
  message,
}: {
  agencyId: string
  carId: string
  whatsapp?: string
  phone?: string
  message: string
}) {
  const t = useTranslations("Showroom")

  const trackContact = () => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agencyId, carId, type: "CONTACT_CLICK" }),
      keepalive: true,
    }).catch(() => {})
  }

  if (!whatsapp && !phone) return null

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {whatsapp && (
        <Button asChild size="lg" className="flex-1" onClick={trackContact}>
          <a
            href={`${whatsapp}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" />
            {t("contactWhatsapp")}
          </a>
        </Button>
      )}
      {phone && (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={trackContact}
        >
          <a href={`tel:${phone.replace(/\s/g, "")}`}>
            <Phone className="size-4" />
            {t("call")}
          </a>
        </Button>
      )}
    </div>
  )
}
