import type { ImageSize } from "./constants"

/**
 * Deliberately separate from `lib/storage`.
 *
 * Client components need to build image URLs, but `lib/storage` imports sharp ,
 * importing it from the browser bundle drags a native Node module in and fails
 * the build. This module is a pure string builder with no runtime dependencies.
 */
export function imageUrl(key: string, size: ImageSize = "card") {
  return `/api/images/${size}/${key}`
}
