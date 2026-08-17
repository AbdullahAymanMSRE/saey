import { eq } from "drizzle-orm"
import QRCode from "qrcode"

import { db } from "@/db"
import { agencies } from "@/db/schema"
import { showroomUrl } from "@/lib/urls"

/**
 * Generated on demand rather than stored, so a slug the admin renames can never
 * leave a stale code cached somewhere. SVG is offered for print because it
 * scales to a windscreen sticker without going soft; PNG for WhatsApp.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const format = new URL(req.url).searchParams.get("format") ?? "svg"

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, slug),
    columns: { id: true, slug: true },
  })
  if (!agency) return new Response("Not found", { status: 404 })

  const url = showroomUrl(agency.slug)
  const options = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    color: { dark: "#0f1c1a", light: "#ffffff" },
  }

  if (format === "png") {
    const buffer = await QRCode.toBuffer(url, {
      ...options,
      type: "png",
      // Large enough to print at a sensible size without visible pixel steps.
      width: 1200,
    })
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="${slug}-qr.png"`,
        "cache-control": "public, max-age=3600",
      },
    })
  }

  const svg = await QRCode.toString(url, { ...options, type: "svg", width: 512 })
  const download = new URL(req.url).searchParams.get("download")

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=3600",
      ...(download
        ? { "content-disposition": `attachment; filename="${slug}-qr.svg"` }
        : {}),
    },
  })
}
