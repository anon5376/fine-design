# Fine

React design system: Base UI primitives, Tailwind v4 tokens, Motion springs, shipped as a shadcn registry. 42 components, 7 blocks, 4 lib files, 1 theme. The look is a decided "achromatic ledger"; Using and Changing below say what that rules out.

Reached through a pointer, not loaded: `public/llms.txt` (generated; per-item descriptions, docs and registry URLs), `registry.json` `meta` (exports and variants per item), `styles/tokens.json` (values, contrast report), `scripts/tokens.mjs` (token source).

## Using Fine

### Install

```
npx shadcn@latest add <origin>/r/<name>.json
```

- Dependencies resolve themselves: other items, `fine-theme`, npm packages (caret ranges). `fine-theme` writes the tokens into `app/globals.css`.
- After `shadcn init`, add `--overwrite`: init wrote its own `components/ui/button.tsx` and `lib/utils.ts`, and Fine's button replaces it (icon-button and dialog build on its API).
- Dependency URLs inside each JSON carry the origin the registry was built with (`REGISTRY_URL`, default `http://localhost:4319`). A deploy builds with `REGISTRY_URL=https://<host> npm run build`; otherwise installs fetch dependencies from localhost.
- Re-applying any item re-writes fine's values into the first `:root` and `.dark` rule. Keep overrides in a later rule.
- The consumer keeps Tailwind's palette (`bg-blue-500` works). The docs site itself removes it, so site code uses semantic tokens only.
- Geist loads as `--font-geist-sans` and `--font-geist-mono` (next/font); fallbacks are system fonts.
- App root: `<MotionConfig reducedMotion="user">` and one `<Toaster />`. `TooltipProvider` is optional (the next tooltip in a toolbar opens at once).

### Tokens

Utilities map to semantic variables; never raw hex, never palette steps.

- Surfaces and text: `bg-background`, `bg-surface`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`.
- Action fills: `bg-primary` (ink), `bg-secondary` (grey), each with `-foreground`, `-hover`, `-active`. `bg-hover`/`bg-active` are translucent ink tints for ghost rows.
- Status: `success`, `warning`, `danger`, `info`, each with `-foreground`, `-subtle`, `-subtle-foreground`.
- `accent` (cobalt) marks the single main data element of a screen: a chart's current series, a selected value. Never chrome, never a second element per screen.
- Radii `rounded-control` (6px), `rounded-container` (8px), `rounded-pill`. Shadows only on overlays (`shadow-overlay`); `shadow-raised` is none, so resting surfaces stay flat.
- `figures` utility (Geist Mono, tabular digits) on money, counts, IDs, addresses. Labels and body stay Geist, sentence case.
- `focus-visible:focus-ring`: 2px ink outline. Dark mode is `.dark`/`.light` on any ancestor; without either, the OS decides. `dark:` follows the same rule.

### Variant API

- `variant` and `size` props via cva; defaults are in each file's `defaultVariants`. Each exported `<name>Variants()` styles another element: `<a className={buttonVariants({ variant: "outline" })}>`. `render={<a href="/x" />}` swaps the element. Merge classes with `cn`.
- Button variants: primary, secondary, outline, ghost, danger; sizes sm, md, lg; `loading` keeps the label width and blocks clicks. IconButton requires `label`. Badge and Alert share neutral plus the four statuses.
- Read `registry.json` `meta.exports` and `meta.variants` before guessing a prop.

### Which component

| Job | Use | Not |
|---|---|---|
| Blocking decision or short form | Dialog | Drawer |
| Secondary panel, filters, mobile nav | Drawer | Dialog |
| Anchored detail or small form | Popover | Dialog |
| One value from a short list | Select | Combobox |
| One value from a long list, with search | Combobox | Select |
| Actions on an item | DropdownMenu | Select |
| Global actions by keyboard (Meta+K) | CommandPalette | DropdownMenu |
| Persistent message in the page | Alert (static) | Toast |
| Transient confirmation of an event | `toast.add({ title, type })` | Alert |
| Status of a record | Badge | Tag |
| A chosen value or filter, removable | Tag | Badge |
| Same-page panels | Tabs | Sidebar |
| Site or app navigation | Navbar, Sidebar, Breadcrumb, Pagination | Tabs |
| Form with validation | Form, Field, FieldLabel, FieldError | bare Input |

Blocks (`components/blocks`) compose `components/ui` only; install one to start from, then edit it.

### Motion tiers

Pick by what moves: the bigger the thing, the slower the tier.

| Tier | Enter | Exit | Use |
|---|---|---|---|
| fast | 80ms | 60ms | hover, focus, check/radio marks, tooltips, hover highlight, avatar image fade-in, tag removal exit |
| moderate | 160ms | 120ms | select/combobox/menu/popover enters, drawers, tabs and pagination indicators, switch thumb, rolling digits, tag sibling glide, slider track-press glide, theme crossfade |
| slow | 240ms, bounce 0.12 | 160ms | dialogs, command palette |
| expressive | 420ms visual, bounce 0.28 (settles in about 810ms) | 160ms | feedback arriving: toasts and the hero slips. The one visible overshoot |

- Motion JS: enter on `spring.<tier>`, exit on `spring.<tier>.exit` with `easing.exit`, both from `@/lib/motion`. CSS: `duration-(--duration-<tier>)` with `ease-spring-<tier>` to enter, `duration-(--duration-<tier>-exit)` with `ease-exit` to leave. Anything else transitions on `--ease-enter`.
- Share the glide: lists, menus and nav use `useFluidHover` and `<FluidHighlight>` from `@/lib/fluid-hover`; popups use `popupSurface`, `popupMotion`, `popupItem` from `@/lib/popup`.
- Animate transform and opacity. Width moves only where size is the information (progress fill, switch thumb, highlight, a figure gaining a digit, slider position).
- Reduced motion drops travel and keeps fades; Motion goes through `MotionConfig reducedMotion="user"`, CSS through `motion-reduce:`.

### Deliberately static

Alert, Badge, Navbar wordmark, a Tag outside a `TagList`, Slider drag and keyboard steps, the dashboard-shell metrics (static strings; bind them to `AnimatedNumber` if they ever update). A state change there is read from the new label or content. Adding motion to these is a regression, not polish.

### Fine's own animations

Original to Fine, not borrowed from a source. Each animates only the change the user needs to notice, on the tiers above, with no loops and no entrance on page load.

| Animation | Where | Moves | Tier | Reduced motion |
|---|---|---|---|---|
| Digit roll | `AnimatedNumber`, pricing block price | Changed digit slides a line in the direction the value moved; added or removed digits and separators grow or shrink | moderate enter, moderate exit tween; unchanged digits stay put | fade only, no travel, no width, instant exit |
| Tag removal | `TagList` + `Tag` | Leaving tag fades and scales to 0.5, then is inert; siblings glide into the gap (position only) | fast exit; moderate glide | fade only, no scale, siblings jump |
| Slider track press | `Slider` | Thumb and range glide to the pressed spot; drag and keys stay instant | moderate (CSS, `data-glide`) | jump |
| Avatar image arrives | `Avatar` | Image fades in over the initials; a cached image shows at once | fast, `ease-enter` | fade kept |
| Theme switch | docs `ThemeToggle` | Page crossfades through a View Transition (`::view-transition-*(root)` in `app/globals.css`) | moderate | instant switch |

Screen readers get the final value or name on the same frame: `AnimatedNumber` keeps an sr-only copy of the formatted value and aria-hides the rolling glyphs; the leaving tag is `inert`; the avatar name moves to the image at once.

### Accessibility contracts

- Base UI supplies roles, keyboard and focus management; keep its parts, do not re-implement them. Tests pin: dialog traps focus and returns it on Escape; menu arrows and highlight; tabs arrows, Home, End; combobox label focuses input; drawer, command palette, accordion, pagination, navbar-at-375px keyboard paths (`tests/keyboard.spec.ts`).
- Icon-only controls take `label` (IconButton). Danger Alert uses `role="alert"`, the rest `role="status"`.
- Every semantic text pair is at least 4.5:1, input and ring borders at least 3:1 (WCAG 1.4.11), accent at least 3:1 on background and surface; `npm run tokens` fails otherwise. Axe scans every docs page in both schemes (`tests/a11y.spec.ts`).

## Changing Fine

### Layout

```
components/ui/*.tsx      one file per component; installs to the same path
components/blocks/*.tsx  compositions of components/ui only
lib/                     utils (cn) · popup · fluid-hover · motion (generated)
styles/                  fine.css, tokens.json (generated)
scripts/                 tokens.mjs · registry.mjs · check-snippets.mts · serve.mjs · screenshots.mts · motion-tour.mts
site/                    docs-only: nav.ts, examples/<slug>.tsx, source.ts, install-command.tsx, chrome
app/                     docs routes: /, /tokens, /components/[slug], /blocks/[slug]
tests/                   keyboard, motion, a11y specs against out/
plugin/, .claude-plugin/ Claude Code plugin (skills/fine-design/SKILL.md, .mcp.json) and its marketplace.json; the skill restates AGENTS.md's using rules, so edit both
registry.json, public/r/*, public/llms.txt   generated by registry:build
```

Never hand-edit `styles/fine.css`, `styles/tokens.json`, `lib/motion.ts`, `registry.json`, `public/r/`, `public/llms.txt`. Edit the source and regenerate.

### Add a component, end to end

1. `components/ui/<name>.tsx`: Base UI primitive underneath, `cva` for `variant` and `size`, semantic tokens only, `focus-visible:focus-ring`, `"use client"` when it uses hooks. Copy the shape of `button.tsx` or `badge.tsx`. A new file per feature; no growing existing files.
2. Motion only if a source animation maps onto a tier or it is the change the user needs to notice (see Motion). Otherwise static, and say so in the doc comment, as `badge.tsx` does.
3. `site/examples/<name>.tsx`: each exported function is one live example and its source is the copyable snippet. Imports must be complete; module-level helpers it references are pulled in automatically.
4. `site/nav.ts`: add the entry (slug, title, `load`). Blocks also take `exportName` and `frame`.
5. `scripts/registry.mjs`: add the category and one-line description in `UI` (or `BLOCKS`). The script throws when a file has no entry or no nav.ts entry, imports an unknown `@/` path, or imports a package missing from `package.json`.
6. `npm run typecheck && npm run check:snippets && npm run build`, then `npm test`.

### Token pipeline

`scripts/tokens.mjs` is the only source: OKLCH ramps, `SEMANTIC` (light and dark), `PAIRS` (contrast gate), `MOTION`. It writes `styles/fine.css`, `styles/tokens.json`, `lib/motion.ts`, and exits 1 on any pair under its minimum or any color outside sRGB. Change a color or tier there, run `npm run tokens`, and read the pass line it prints. A new semantic color needs its `PAIRS`. `fine-theme` in `scripts/registry.mjs` is derived from `fine.css` with postcss, so it follows automatically; its semantic colors are in the `css` field on purpose (a `cssVars` write would never overwrite the consumer's `--input` and `--ring` after `shadcn init`).

### Motion rules and sources

- Tiers come from Fluid Functionalism (MIT); expressive is Rare UI's SEND spring. easyui's SlidePagination technique drives the pagination indicator. Credits table is in `README.md`. The animations in Fine's own animations above are original, not borrowed; do not credit them.
- Port a source animation onto the nearest tier. Do not invent durations or bounce values in a component. A new original animation is allowed only for a change the user needs to notice; list it in Fine's own animations, state tier and reduced-motion behaviour in its one doc comment, and never block input, delay content or change an accessible name mid-animation.
- `ease-spring-expressive` is the settle curve of the same underdamped spring Motion runs, generated in `tokens.mjs`.
- `tests/motion.spec.ts` samples computed styles per frame to prove each animation uses its token and that movement becomes a jump under reduced motion. Add a case for any new animation.

### Decided look (final)

Ink chrome (primary, focus ring), grey secondary, cobalt accent on a screen's main data element only, Geist plus figures, 6/8px radii, flat at rest. No taglines, helper text, or secondary labels anywhere (docs and components). No gradients, neon, or decorative color. Input borders stay at 3:1 or better. Match the file you are editing; comments are sparse and say why.

### Verify

| Command | Proves |
|---|---|
| `npm run tokens` | Contrast pairs and sRGB gamut; regenerates CSS, JSON, motion |
| `npm run typecheck` | The repo compiles |
| `npm run check:snippets` | Every copyable docs snippet compiles as its own file |
| `npm run build` | tokens, registry (54 items) and the static export in `out/` |
| `npm test` | Keyboard paths, per-frame motion, axe, against `out/` on port 4329 (build first) |
| `npm run verify` | build, typecheck, snippets, Playwright in one go |
| `npm run verify:install` | Registry items install into a fresh Next app and render with fine's tokens and motion; needs network and a prior build (temp app path is printed); after a deploy built with `REGISTRY_URL=https://…`, it installs from the live registry instead |
| `node scripts/screenshots.mts [states]` | Pages at 375 and 1440, light and dark, for a visual look |
| `node scripts/motion-tour.mts` | Motion video tour (needs ffmpeg) |

A registry change is proven by `npm run verify:install` (fresh Next app, `shadcn init`, `add --overwrite`, build, browser checks) plus a look at `screenshots/install/`; the registry JSON alone proves nothing. Specs wait on `html[data-hydrated]`; a new interactive page keeps that signal.
