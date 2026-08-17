"use client"

import { useEffect, useRef } from "react"

/**
 * Fires once per mount, after paint.
 *
 * Counted from the client rather than during server render so a crawler pulling
 * HTML, a link prefetch, or an uptime check cannot inflate an agency's numbers.
 * Failures are swallowed, analytics must never break a showroom.
 */
export function ViewTracker({
  agencyId,
  carId,
  type,
}: {
  agencyId: string
  carId?: string
  type: "SHOWROOM_VIEW" | "CAR_VIEW"
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    const body = JSON.stringify({ agencyId, carId, type })
    // keepalive so a visitor who taps straight through to WhatsApp still counts.
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  }, [agencyId, carId, type])

  return null
}
