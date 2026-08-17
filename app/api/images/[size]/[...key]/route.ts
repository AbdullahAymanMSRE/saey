import { IMAGE_SIZES, type ImageSize } from "@/lib/constants"
import { isSafeKey, readImage } from "@/lib/storage"

/**
 * Serves images off the Railway volume.
 *
 * The key comes from the URL, so `isSafeKey` is the boundary between user input
 * and an arbitrary file read, everything below it assumes the key is clean.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string; key: string[] }> },
) {
  const { size, key: parts } = await ctx.params
  const key = parts.join("/")

  if (!(size in IMAGE_SIZES) || !isSafeKey(key)) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const file = await readImage(key, size as ImageSize)
    return new Response(new Uint8Array(file), {
      headers: {
        "content-type": "image/webp",
        // Content is addressed by a hash of the bytes, so it can never change
        // under a given URL, safe to cache hard.
        "cache-control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
