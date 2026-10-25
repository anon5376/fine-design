```
  ███████╗██╗███╗   ██╗███████╗
  ██╔════╝██║████╗  ██║██╔════╝
  █████╗  ██║██╔██╗ ██║█████╗
  ██╔══╝  ██║██║╚██╗██║██╔══╝
  ██║     ██║██║ ╚████║███████╗
  ╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝
```

React design system: Base UI primitives, Tailwind CSS v4 tokens, Motion springs, distributed as a shadcn registry.

Live site: https://fine-design.qeqx.chatgpt.site

![Fine's dashboard shell block: sidebar, breadcrumb header, four figures with one cobalt, and a paged transfers table](docs/preview.png)

```
┌─ status ──────────────────────────────────────────────────────────────┐
│  built     tokens · 41 components · 7 blocks · docs site · tests      │
│  live      shadcn registry · llms.txt · agent plugin                  │
└───────────────────────────────────────────────────────────────────────┘
```

## How it fits together

```
 scripts/tokens.mjs ──▶ styles/fine.css ──▶ components/ui/*.tsx ──▶ registry.json ──▶ public/r/*.json
  one source of          CSS variables:      Base UI + cva +         shadcn build       npx shadcn add
  truth; fails on        light · dark · OS   Motion tiers;                              <site>/r/<name>.json
  any AA miss            + Tailwind @theme   semantic tokens only
        │
        ├──▶ styles/tokens.json   machine-readable values + contrast report
        └──▶ lib/motion.ts        spring tiers for Motion
```

Agents: read [AGENTS.md](AGENTS.md) (using and changing the system) and `/llms.txt` on the docs site (per-item index), or install the plugin below.

## Use with agents

- Claude Code: `/plugin marketplace add anon5376/fine-design`, then `/plugin install fine-design@fine-design`. Adds the `fine-design` skill and the shadcn MCP server (search, view, add).
- Codex and other agents: copy `plugin/skills/fine-design` into the agent's skills directory (Codex: `~/.codex/skills/fine-design/`).
- Any project: add the namespace to `components.json`, then `npx shadcn@latest add @fine/button`. For agent tools, run `npx shadcn@latest mcp`.

```json
"registries": { "@fine": "https://fine-design.qeqx.chatgpt.site/r/{name}.json" }
```

`https://fine-design.qeqx.chatgpt.site/llms.txt` is the per-item index for agents.

## Install from the registry

```bash
npx shadcn@latest add https://fine-design.qeqx.chatgpt.site/r/button.json
```

- Each item brings its dependencies: other items, `fine-theme`, npm packages. `fine-theme` writes the tokens into your `globals.css`; it keeps Tailwind's own palette.
- Project needs React 19, Tailwind v4 and the default `components.json` aliases. After `shadcn init`, add `--overwrite` so Fine's `button` and `utils` replace init's.
- Items reference each other by absolute URL, taken from `REGISTRY_URL` at build time (default `http://localhost:4319`). For a deploy: `REGISTRY_URL=https://<host> npm run build`.
- Every docs page shows its install line. `/r/registry.json` indexes all 53 items (41 ui, 7 blocks, 4 lib, `fine-theme`).

## Develop

```bash
npm install
npm run dev              # docs on http://localhost:4318
npm run tokens           # regenerate CSS, JSON, motion; exits 1 on contrast/gamut failure
npm run registry:build   # registry.json + public/llms.txt, then shadcn build → public/r/*.json
npm run build            # tokens → registry:build → static site in out/
npm run serve            # serve out/ on PORT (default 4319)
npm run typecheck
npm run check:snippets   # typecheck every copyable docs snippet
npm test                 # Playwright: keyboard, motion, axe; needs a build, uses installed Chrome
npm run verify           # build → typecheck → snippets → Playwright
npm run verify:install   # install select + dialog into a fresh Next app and check it; needs network and a prior build
node scripts/screenshots.mts [states]   # every page at 375/1440, light/dark → screenshots/
node scripts/motion-tour.mts            # motion video tour → screenshots/motion/ (needs ffmpeg)
```

## Theming

```
 ┌─ primitives ─────────────┐      ┌─ semantic (light / dark) ───────────────────────┐
 │ gray  blue  red  green   │ ───▶ │ background  surface  foreground  muted  border  │
 │ amber · 50 → 950 OKLCH   │      │ input  ring  primary  secondary  accent         │
 │ type · space · radius    │      │ success  warning  danger  info  (+ -foreground, │
 │ shadow · motion · z      │      │ -subtle, -subtle-foreground)  hover  active     │
 └──────────────────────────┘      └─────────────────────────────────────────────────┘
```

- Edit `SEMANTIC` (or a ramp) in `scripts/tokens.mjs`, then `npm run tokens`. Every text/background pair must pass WCAG AA (4.5:1 text, 3:1 UI), and every color must fit in sRGB, or the script fails.
- Dark mode: `.dark` or `.light` on `<html>` (or any subtree). Without either class, the OS setting decides.
- Components use semantic tokens only. The docs site removes Tailwind's default palette, so `bg-blue-500` does not exist there (an installed project keeps its palette); use `bg-primary`, `text-muted-foreground`, `border-input`.
- Chrome is ink: the primary button and the focus ring are near-black (near-white in dark). `accent` (cobalt) marks the main data element only: a chart's current series, a selected value. No shadows on things at rest.
- Money, counts, IDs and addresses take `figures` (Geist Mono, tabular digits). Labels and body stay in Geist, sentence case.

## Motion

```
 tier         enter spring                   exit tween   moves
 ──────────   ────────────────────────────   ──────────   ─────────────────────────────
 fast         80ms  · bounce 0               60ms         hover, focus, highlights, tooltips
 moderate     160ms · bounce 0               120ms        popup enters (select, combobox, menu, popover), drawers, indicators
 slow         240ms · bounce 0.12            160ms        dialogs, command palette
 expressive   420ms · bounce 0.28 (≈810ms)   160ms        toasts: feedback arriving, the one visible overshoot
```

Enter on `spring.<tier>`, exit on `spring.<tier>.exit` (`lib/motion.ts`); expressive is RareUI's visual duration (the CSS curve runs the full ≈810ms settle) and exits on slow's tween, and popups leave on fast's exit. CSS uses `duration-(--duration-<tier>)` with `ease-spring-<tier>` to enter and `duration-<tier>-exit` with `ease-exit` to leave. Every other transition defaults to `--ease-enter`, and Motion tweens take `easing.enter` and `easing.exit`. Lists, menus and nav share one hover highlight that glides between items (`useFluidHover` + `<FluidHighlight>` in `lib/fluid-hover.tsx`). Prefer transform and opacity; width is animated only where the size is the information (progress fill, switch thumb, highlight). Wrap apps in `<MotionConfig reducedMotion="user">`; with reduced motion on, movement is dropped and fades remain.

## Layout

```
 fine-design/
 ├─ components/
 │  ├─ ui/            one file per component (installed to the same path)
 │  └─ blocks/        compositions of components/ui only: auth-form · hero ·
 │                     feature-grid · pricing · faq · footer · dashboard-shell
 ├─ lib/              utils (cn) · popup · fluid-hover · motion (generated)
 ├─ styles/           fine.css · tokens.json (generated)
 ├─ scripts/          tokens · registry · check-snippets · serve · screenshots · motion-tour
 ├─ site/             docs-only code: nav, examples/<slug>.tsx, chrome
 ├─ app/              docs routes: /tokens · /components/[slug] · /blocks/[slug]
 ├─ tests/            keyboard · motion · a11y (Playwright, against out/)
 ├─ plugin/           Claude Code plugin: skills/fine-design (also usable in Codex) + .mcp.json
 ├─ .claude-plugin/   marketplace.json for `/plugin marketplace add`
 └─ registry.json · public/r/ · public/llms.txt   generated by registry:build
```

## Adding a component

1. Write `components/ui/<name>.tsx`: Base UI primitive underneath, `cva` for `variant`/`size`, semantic tokens only, `focus-visible:focus-ring`.
2. Motion, if any, comes from a source animation mapped onto `spring.<tier>`. Static is fine.
3. Add `site/examples/<name>.tsx`. Each exported function is one live example, and its source is the copyable code.
4. Add the entry to `site/nav.ts`, and its category and one-line description to `UI` in `scripts/registry.mjs` (the build fails if either is missing).
5. Run `npm run typecheck && npm run check:snippets && npm run build && npm test`.

## Credits

Full notices and licenses: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Fine itself is [MIT](LICENSE).

| From | License | Used for |
|---|---|---|
| [Fluid Functionalism](https://github.com/mickadesign/fluid-functionalism) | MIT | motion tiers, hover highlight, button press geometry, spinner, icon stroke hover |
| [Rare UI](https://rareui.com) | MIT + Commons Clause + Attribution | expressive tier: the FAQ reply bubble's SEND spring (visualDuration 0.42, bounce 0.28); the hero's falling-slips moment takes its idea from Gravity Letters (idea only, no code) |
| [easyui](https://easyui.site) | MIT | Pagination active-page slide: SlidePagination's shared-layoutId technique, rewritten onto our tokens |
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT | art direction: the "achromatic ledger" app style (ink chrome, mono figures, 6/8 radius) |
| [Base UI](https://github.com/mui/base-ui) | MIT | primitives |
