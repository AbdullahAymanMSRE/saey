import { MAX_UPLOAD_BYTES } from "@/lib/constants"
import { requireAgency, route } from "@/lib/session"
import { storeImage } from "@/lib/storage"

export const runtime = "nodejs"

export async function POST(req: Request) {
  return route(async () => {
    const { agency } = await requireAgency()

    const form = await req.formData()
    const files = form.getAll("files").filter((f): f is File => f instanceof File)
    const kind = String(form.get("kind") ?? "cars")
    const prefix = kind === "branding" ? `branding/${agency.id}` : `cars/${agency.id}`

    if (!files.length) {
      return Response.json({ error: "No files uploaded" }, { status: 400 })
    }

    const stored = []
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return Response.json(
          { error: `${file.name} is larger than 12MB` },
          { status: 413 },
        )
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      stored.push(await storeImage(buffer, prefix))
    }

    return Response.json({ images: stored })
  })
}
