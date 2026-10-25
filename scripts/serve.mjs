// Serves the static export in out/ (docs preview and Playwright). Stdlib only.
import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"

const root = join(process.cwd(), "out")
const port = Number(process.env.PORT ?? 4319)
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2", ".map": "application/json",
}

const resolve = url => {
  const path = join(root, normalize(decodeURIComponent(new URL(url, "http://x").pathname)))
  if (!path.startsWith(root)) return null
  try {
    return statSync(path).isDirectory() ? join(path, "index.html") : path
  } catch {
    return null
  }
}

createServer((req, res) => {
  const file = resolve(req.url ?? "/")
  try {
    if (!file) throw new Error()
    statSync(file)
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found")
  }
}).listen(port, "127.0.0.1", () => console.log(`out/ on http://localhost:${port}`))
