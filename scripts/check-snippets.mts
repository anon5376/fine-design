// Typechecks every copyable docs snippet as its own file, so "copy" always yields code that compiles.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { parseExamples } from "../site/source.ts"

const dir = ".snippets"
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir)
let count = 0
for (const file of readdirSync("site/examples")) {
  for (const ex of parseExamples(readFileSync(`site/examples/${file}`, "utf8"))) {
    writeFileSync(`${dir}/${file.replace(".tsx", "")}--${ex.name}.tsx`, ex.code)
    count++
  }
}
writeFileSync(`${dir}/tsconfig.json`, JSON.stringify({ extends: "../tsconfig.json", include: ["./*.tsx", "../next-env.d.ts"] }))
try {
  execFileSync("npx", ["tsc", "--noEmit", "-p", `${dir}/tsconfig.json`], { stdio: "inherit" })
  console.log(`${count} snippets typecheck`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
