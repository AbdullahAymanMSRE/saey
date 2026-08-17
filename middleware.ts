import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  // Everything except API routes, Next internals, and anything with a file
  // extension. Uploaded images are served from /api/images, so they fall out
  // here too and never get a locale prefix.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
