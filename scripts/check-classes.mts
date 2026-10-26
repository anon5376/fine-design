// Fails on appearance classes that bypass the preset token contract (AGENTS.md, "The preset contract"), so a
// Folio or Poster install cannot be broken by a class that only fits Ledger. Reads string literals in
// components/, site/ and app/; comments and JSX text are ignored. Nothing generated lives in these roots.
import { readdirSync, readFileSync } from "node:fs"

const ROOTS = ["components", "site", "app"]
// The launch films are their own fixed artwork, not preset-driven chrome.
const SKIP = ["site/film/", "site/film03/", "site/film04/", "app/film/"]

type Rule = { id: string; match: RegExp; scope?: string; fix: string }
const RULES: Rule[] = [
  // `border-0`, `border-t-0` and colors (`border-border`, `border-input`) stay allowed: they set no width.
  { id: "border-width", match: /^border(-[trblxyse])?(-[1-9]\d*)?$/, fix: "border-line, border-t-line, border-r-line, border-b-line or border-l-line (they read --border-width)" },
  { id: "font-weight", match: /^font-(medium|semibold|bold)$/, fix: "font-label, font-title or font-strong (--weight-*)" },
  // rounded-full (circles) and rounded-none stay allowed.
  { id: "radius", match: /^rounded(-(t|r|b|l|s|e|tl|tr|br|bl|ss|se|ee|es))?(-(xs|sm|md|lg|xl|2xl|3xl))?$/, fix: "rounded-control, rounded-container, rounded-small or rounded-pill (--radius-*)" },
  // Control heights cannot be told from other boxes by syntax, so this one reads components/ only. h-7, h-9 and
  // h-10 are Ledger's --control-sm, -md and -lg (1.75, 2.25, 2.5rem): in a shipped component they hard-code Ledger.
  { id: "control-height", match: /^h-(7|9|10)$/, scope: "components/", fix: "h-control-sm, h-control-md or h-control-lg (--control-*)" },
]

// Exceptions, one per file and class, each with the reason it stays. An entry that matches nothing fails the run.
const ALLOW: { file: string; token: string; reason: string }[] = [
  { file: "components/ui/slider.tsx", token: "border-2", reason: "Thumb ring: a fixed 2px mark on a circle, not an outline, so it does not follow --border-width" },
]

type Literal = { text: string; line: number }

// Collects string literals ("", '' and template text) with their start line, skipping comments.
function literals(src: string): Literal[] {
  const found: Literal[] = []
  // `code` is the file or a ${} hole (depth counts its braces); `tpl` is template text.
  const stack: { type: "code" | "tpl"; depth: number; buf: string; line: number }[] = [{ type: "code", depth: 0, buf: "", line: 1 }]
  let line = 1
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    const top = stack[stack.length - 1]
    if (c === "\n") line++
    if (top.type === "tpl") {
      if (c === "\\") i++
      else if (c === "`") {
        found.push({ text: top.buf, line: top.line })
        stack.pop()
      } else if (c === "$" && src[i + 1] === "{") {
        found.push({ text: top.buf, line: top.line })
        top.buf = ""
        stack.push({ type: "code", depth: 0, buf: "", line })
        i++
      } else top.buf += c
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++
      line++
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2)
      const stop = end === -1 ? src.length : end + 2
      line += src.slice(i, stop).split("\n").length - 1
      i = stop - 1
    } else if (c === '"' || (c === "'" && !/\w/.test(src[i - 1] ?? ""))) {
      // A quote right after a letter is an apostrophe in JSX text ("Don't"). Strings end at the line break, so a stray one cannot swallow later lines.
      let j = i + 1
      while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1
      found.push({ text: src.slice(i + 1, j), line })
      i = src[j] === "\n" ? j - 1 : j
    } else if (c === "`") stack.push({ type: "tpl", depth: 0, buf: "", line })
    else if (c === "{") top.depth++
    else if (c === "}") {
      if (top.depth === 0 && stack.length > 1) {
        stack.pop()
        stack[stack.length - 1].line = line
      } else top.depth--
    }
  }
  return found
}

// `md:hover:!font-bold` and `data-[open]:font-bold` both reduce to `font-bold`; colons inside brackets do not split.
function utility(token: string) {
  let depth = 0
  let cut = 0
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === "[" || c === "(") depth++
    else if (c === "]" || c === ")") depth--
    else if (c === ":" && depth === 0) cut = i + 1
  }
  return token.slice(cut).replace(/^[!-]+|!$/g, "")
}

// Sentences are not class lists: a lowercase word then punctuation then a space or the end.
const prose = (text: string) => /[a-z][,;!?.](\s|$)/.test(text)

const files = ROOTS.flatMap(root => readdirSync(root, { recursive: true, encoding: "utf8" }).map(f => `${root}/${f}`))
  .filter(f => /\.tsx?$/.test(f) && !SKIP.some(s => f.startsWith(s)))
  .sort()

const used = new Set<number>()
const hits: string[] = []
for (const file of files) {
  for (const lit of literals(readFileSync(file, "utf8"))) {
    if (prose(lit.text)) continue
    for (const m of lit.text.matchAll(/\S+/g)) {
      const token = utility(m[0])
      const rule = RULES.find(r => (!r.scope || file.startsWith(r.scope)) && r.match.test(token))
      if (!rule) continue
      const allowed = ALLOW.findIndex(a => a.file === file && a.token === token)
      if (allowed !== -1) {
        used.add(allowed)
        continue
      }
      const at = lit.line + lit.text.slice(0, m.index).split("\n").length - 1
      hits.push(`${file}:${at}  ${m[0]}  [${rule.id}]  use ${rule.fix}`)
    }
  }
}
ALLOW.forEach((a, i) => {
  if (!used.has(i)) hits.push(`check-classes.mts  allow-list entry ${a.file} ${a.token} matches nothing; remove it`)
})

if (hits.length) {
  console.error(hits.join("\n"))
  console.error(`\ncheck:classes: ${hits.length} problem${hits.length === 1 ? "" : "s"}`)
  process.exit(1)
}
console.log(`check:classes: ${files.length} files, no class bypasses the token contract (${ALLOW.length} allowed)`)
