import type { NextConfig } from "next"

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // The registry origin this build serves (see scripts/registry.mjs); install lines render it at build time.
  env: { REGISTRY_URL: (process.env.REGISTRY_URL ?? "http://localhost:4319").replace(/\/$/, "") },
}

export default config
