import { createHash } from "node:crypto"
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

import { IMAGE_SIZES, MAX_UPLOAD_BYTES, type ImageSize } from "./constants"

/**
 * Images live on a Railway persistent volume. The container filesystem is
 * ephemeral, so UPLOAD_DIR must point at a mounted volume in production or every
 * uploaded photo disappears on the next redeploy.
 *
 * The volume is also why the app stays single-instance: a second replica would
 * not see the first one's files.
 */
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./.uploads")

export type StoredImage = {
  /** Key without extension, e.g. `cars/<agency>/<hash>`. */
  path: string
  width: number
  height: number
}

function keyToFile(key: string, size: ImageSize) {
  return path.join(UPLOAD_DIR, `${key}.${size}.webp`)
}

/**
 * Rejects any key that would climb out of UPLOAD_DIR. The serving route takes
 * its key from the URL, so this is the boundary between "user input" and
 * "arbitrary file read".
 */
export function isSafeKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/")) return false
  return /^[a-zA-Z0-9/_-]+$/.test(key)
}

/**
 * Writes the sized variants an agency page actually serves. The original is
 * deliberately not kept: nothing renders it, and a showroom browsed on mobile
 * data in Riyadh should never be shipped a 4MB camera JPEG.
 */
export async function storeImage(
  buffer: Buffer,
  prefix: string,
): Promise<StoredImage> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too large")
  }

  const image = sharp(buffer, { failOn: "error" })
  const meta = await image.metadata()
  if (!meta.width || !meta.height) throw new Error("Unrecognised image")

  const hash = createHash("sha256")
    .update(buffer)
    .digest("hex")
    .slice(0, 24)
  const key = `${prefix}/${hash}`

  await mkdir(path.dirname(keyToFile(key, "full")), { recursive: true })

  for (const [size, width] of Object.entries(IMAGE_SIZES)) {
    await sharp(buffer, { failOn: "error" })
      .rotate() // honour EXIF orientation before we discard the metadata
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: size === "thumb" ? 72 : 82 })
      .toFile(keyToFile(key, size as ImageSize))
  }

  return { path: key, width: meta.width, height: meta.height }
}

export async function readImage(key: string, size: ImageSize) {
  return readFile(keyToFile(key, size))
}

export async function deleteImage(key: string) {
  await Promise.all(
    (Object.keys(IMAGE_SIZES) as ImageSize[]).map((size) =>
      unlink(keyToFile(key, size)).catch(() => {}),
    ),
  )
}

/** Used by the seed/health check to fail loudly rather than at first upload. */
export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, ".keep"), "")
}

export function imageUrl(key: string, size: ImageSize = "card") {
  return `/api/images/${size}/${key}`
}
