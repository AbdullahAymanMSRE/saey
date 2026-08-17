import { z } from "zod"

import { clientIp, track } from "@/lib/analytics"

const schema = z.object({
  agencyId: z.string().min(1),
  carId: z.string().nullish(),
  type: z.enum(["SHOWROOM_VIEW", "CAR_VIEW", "CONTACT_CLICK"]),
})

/**
 * Called from the showroom after paint. Kept as a POST from the client rather
 * than counted during server render so a bot fetching HTML, a prefetch, or the
 * agency's own preview does not inflate an agency's numbers.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 })

  try {
    const result = await track({
      ...parsed.data,
      ip: clientIp(req.headers),
      userAgent: req.headers.get("user-agent") ?? "",
    })
    return Response.json({ ok: true, counted: result.counted })
  } catch {
    // Analytics must never break a showroom page.
    return Response.json({ ok: false })
  }
}
