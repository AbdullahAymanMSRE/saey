import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  // Deliberately NOT `output: "standalone"`. Railway builds with Nixpacks and
  // starts with `next start`, which standalone breaks, it emits a server that
  // expects .next/static and public to be copied in beside it.
  serverExternalPackages: ["sharp"],
  images: {
    // Uploads are served from our own volume route, which already emits the
    // right cache headers and sized variants.
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
