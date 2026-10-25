import { readFile } from "node:fs/promises"
import path from "node:path"

export type ExampleSource = { name: string; title: string; code: string }

export const readSource = (file: string) => readFile(path.join(process.cwd(), file), "utf8")

const uses = (code: string, name: string) => new RegExp(`\\b${name}\\b`).test(code)

/**
 * Splits an examples file into its exported functions. Each one's code is copy-paste complete:
 * the imports it uses, the module-level data and helpers it references, and "use client" when it needs hooks.
 */
export function parseExamples(source: string): ExampleSource[] {
  const client = source.startsWith('"use client"')
  const importRe = /^import [\s\S]*?from ["'][^"']+["']$/gm
  const src = source.replace(/^"use client"\n+/, "")
  const imports = src.match(importRe) ?? []
  const blocks = src
    .replace(importRe, "")
    .split(/^(?=(?:export )?(?:function|const|let|type) )/m)
    .map(b => b.trim())
    .filter(Boolean)
  const helpers = blocks
    .filter(b => !b.startsWith("export function "))
    .map(code => ({ code, name: /^(?:function|const|let|type) (\w+)/.exec(code)?.[1] ?? "" }))

  return blocks
    .filter(b => b.startsWith("export function "))
    .map(fn => {
      const name = /^export function (\w+)/.exec(fn)![1]
      // Pull in referenced helpers until nothing new is needed, then keep source order.
      const needed = new Set<string>()
      for (let grew = true; grew; ) {
        grew = false
        const scope = [fn, ...helpers.filter(h => needed.has(h.name)).map(h => h.code)].join("\n")
        for (const h of helpers) if (h.name && !needed.has(h.name) && uses(scope, h.name)) needed.add(h.name), (grew = true)
      }
      const deps = helpers.filter(h => needed.has(h.name)).map(h => h.code)
      const body = [...deps, fn].join("\n\n")
      const used = imports.filter(line => {
        const names = line.match(/\{([^}]+)\}/)?.[1].split(",").map(n => n.trim().replace(/^type /, "").split(" as ").pop()!) ?? [line.split(" ")[1]]
        return names.some(n => n && uses(body, n))
      })
      const directive = client && /\buse[A-Z]\w*\(|\bon[A-Z]\w*=/.test(body) ? '"use client"\n\n' : ""
      return {
        name,
        title: name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`),
        code: `${directive}${used.join("\n")}\n\n${body}\n`,
      }
    })
}
