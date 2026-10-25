import { defineConfig } from "@playwright/test"

// Runs against the static export (npm run build first). Uses the installed Chrome, so no browser download.
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4329", channel: "chrome" },
  webServer: {
    command: "PORT=4329 node scripts/serve.mjs",
    url: "http://localhost:4329",
    reuseExistingServer: true,
  },
})
