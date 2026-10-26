# Fine

React design system: Base UI primitives, Tailwind v4 tokens, Motion springs, shipped as a shadcn registry. 52 components, 7 blocks, 4 lib files, 1 base item and 4 theme items (68 registry items).

Behavior and appearance are separate. Behavior is the same in every project: Base UI roles, keyboard and focus, validation, reduced motion, the motion tiers, the accessibility contracts, and styling through tokens only. Appearance is a preset: Ledger, Folio or Poster, each a set of token values. The docs site switches between them with `data-preset` on `<html>`.

Reached through a pointer, not loaded: `public/llms.txt` (generated; per-item descriptions, docs and registry URLs), `registry.json` `meta` (exports and variants per item), `styles/tokens.json` (values and contrast report, per preset under `presets.<name>`), `scripts/tokens.mjs` (token machinery), `scripts/presets/<name>.mjs` (one preset's values).

## Direction first

Before building a new site, page or screen, settle the direction. Read the project's design doc if it has one (`DESIGN.md` or similar). Otherwise decide these seven points from the brief and write them into a short `DESIGN.md` before the first component:

- Audience: who uses it and in what situation.
- Content: what is on the screen and in what volume.
- Typography: the faces, the scale, how figures look.
- Palette: neutrals, the one accent role, status colors.
- Composition: density, grid, how much space surrounds things.
- Imagery: photographs, illustration, icons, or none.
- Interaction character: how fast and how visible the motion is, within the tiers below.

Then pick the closest preset, or derive a new one (see Making a preset), and build with Fine components. Use Ledger when the user asks for it, or when the job is a dense data or operations tool. Fine's own docs defaults to Ledger.

A small edit inside an existing screen follows that screen's direction. Do not run this step for it.

| Preset | Direction | Take it for |
|---|---|---|
| Ledger | Achromatic, dense, flat at rest, ink chrome with one cobalt accent | Dashboards, admin and finance tools, anything a user works in all day |
| Folio | Editorial, set for reading: warm paper, serif titles, one quiet aubergine accent | Docs, publications, content-led product pages |
| Poster | Loud, large type, strong contrast: a flat hot magenta for the main action and the accent, hard shadows | Launches, campaigns, marketing and event pages |

Each row states the preset's intent. The values are in `scripts/presets/<name>.mjs`; read the file or `styles/tokens.json` rather than assuming them.

## Using Fine

### Install

Install a theme once, then components. A component never re-skins a project.

```
npx shadcn@latest add <origin>/r/theme-<preset>.json     # once: ledger, folio or poster
npx shadcn@latest add <origin>/r/<name>.json             # any number of times
```

- Every ui, block and lib item depends on `fine-base`: the `@theme inline` mappings, the `figures`, `figure-fit`, `focus-ring` and `border-line` utilities, keyframes, motion scalars, and Ledger's value for every token placed in `@layer base`. Your own `:root` and an installed theme are unlayered, so they win wherever they sit in the file. A component installed alone renders in Ledger.
- A theme (`theme-ledger`, `theme-folio`, `theme-poster`) holds values only and depends on nothing. It writes colors, fonts, weights, radii, type scale, control sizes, padding, border width and shadows to `:root`, `.light`, `.dark` and the OS dark query. Installing a second theme replaces the first. Keep overrides in a later rule.
- `fine-theme` is an alias of `theme-ledger`, so older install lines still work.
- Load the fonts listed in the theme item's `meta.fonts` with next/font, one CSS variable each. Pass an entry's `axes` or `weights` (as `axes` and `weight`) when it lists them: Folio's Newsreader and Poster's Bricolage Grotesque list `opsz`, without which they load as a static cut. Ledger needs Geist as `--font-geist-sans` and `--font-geist-mono`; fallbacks are system fonts.
- After `shadcn init`, add `--overwrite`: init wrote its own `components/ui/button.tsx` and `lib/utils.ts`, and Fine's button replaces it (icon-button and dialog build on its API). Fine's `cn` is an extended tailwind-merge that knows the preset utilities, so `h-control-md` and `h-12` merge.
- Dependency URLs inside each JSON carry the origin the registry was built with (`REGISTRY_URL`, default `http://localhost:4319`). A deploy builds with `REGISTRY_URL=https://<host> npm run build`; otherwise installs fetch dependencies from localhost.
- The consumer keeps Tailwind's palette (`bg-blue-500` works). The docs site removes it, so site code uses semantic tokens only, and the preset utilities (`font-display`, `font-title`, `font-strong`, `border-line`, `rounded-*`) for its own chrome, so titles, frames and code blocks follow the selected preset.
- App root: `<MotionConfig reducedMotion="user">` and one `<Toaster />`. `TooltipProvider` is optional (the next tooltip in a toolbar opens at once).

### Switching presets

- In a project: install the other theme. It replaces the values.
- In the docs: the Preset select in the sidebar sets `data-preset` on `<html>` and stores the choice in localStorage `preset`. No attribute means Ledger. `styles/presets.css` scopes each non-Ledger preset as `:root[data-preset="<name>"]`, with `.light` and `.dark` variants.
- Dark mode is `.dark` or `.light` on any ancestor; without either, the OS decides. `dark:` follows the same rule. Every preset defines both modes.

### Tokens

Utilities map to semantic variables; never raw hex, never palette steps. The names are the same in every preset; the values change.

- Surfaces and text: `bg-background`, `bg-surface`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`.
- Action fills: `bg-primary`, `bg-secondary`, each with `-foreground`, `-hover`, `-active`. `bg-hover` and `bg-active` are translucent tints for ghost rows.
- Status: `success`, `warning`, `danger`, `info`, each with `-foreground`, `-subtle`, `-subtle-foreground`.
- `accent` marks emphasis on data. How many accents a screen carries is the preset's call; Ledger allows one. An accent never reads as danger: the token build fails a preset whose accent, or chromatic primary, is within 40 degrees of `danger` in hue.
- `figures` utility (the `--font-figure` face, tabular digits) on money, counts, IDs and addresses.
- `figure-fit` on a stat figure in a card: put it in a parent that is `@container` and sets the size (`text-xl`), and the figure keeps that size when it fits and shrinks when the card or the face is too narrow, so no preset or width pushes it out. It reserves `--figure-chars` glyphs (default 12; set it on the grid to the longest figure, as dashboard-shell does) of `--figure-advance` em each.
- `focus-visible:focus-ring`: a 2px outline in the ring color.

The preset contract. Utilities and variables are fixed; a preset supplies the values in `scripts/presets/<name>.mjs`.

| Group | Variable | Utility | Used by |
|---|---|---|---|
| Fonts | `--font-sans`, `--font-mono`, `--font-display`, `--font-figure` | `font-sans`, `font-mono`, `font-display`, `figures` | body and UI, code, Heading and card, dialog and drawer titles (named display because shadcn init already maps font-heading to the sans), figures |
| Weights | `--weight-label`, `--weight-title`, `--weight-strong` | `font-label`, `font-title`, `font-strong` | controls and labels; in-flow titles; container titles and wordmarks |
| Radii | `--radius-control`, `--radius-container`, `--radius-small`, `--radius-pill` | `rounded-control`, `rounded-container`, `rounded-small`, `rounded-pill` | controls; cards and popups; checkbox, kbd, tag-remove; badges and tracks |
| Figure width | `--figure-advance` | `figure-fit` | the widest digit or money glyph of the figure face, in em; sizes a stat figure so it fits its card |
| Type scale | `--text-<2xs..6xl>` with `--line-height` and, from 2xl, `--letter-spacing` | `text-<size>` | all text |
| Control size | `--control-sm`, `--control-md`, `--control-lg` | `h-control-*`, `size-control-*`, `min-w-control-*` | button, input, select, combobox heights |
| Padding | `--pad-control-*`, `--pad-field-*`, `--pad-container-*` | `px-pad-control-*`, `px-pad-field-*`, `p-pad-container-*` | button; input, select, combobox, textarea; alert and popover (sm), card (md), dialog and drawer (lg) |
| Border width | `--border-width` | `border-line`, `border-t-line`, `border-r-line`, `border-b-line`, `border-l-line` | every control and container outline |
| Shadows | `--shadow-raised`, `--shadow-control`, `--shadow-overlay` | `shadow-raised`, `shadow-control`, `shadow-overlay` | resting surfaces (card); a control's own lift (the selected tab indicator); popups, dialogs, drawers, toasts |
| Colors | `--background`, `--foreground`, `--primary` and the rest of the semantic set | as above | everything |

Circles (radio, slider thumb, avatar) stay `rounded-full`. The switch thumb is the pill radius minus the track's 2px inset, so it is a circle under a large pill and square under a near-zero one. Plain `border` is Tailwind's 1px and is for code that sits outside the preset. Components use `border-line`.

Shared across presets, because they are behavior: motion durations and springs, the focus ring's width and offset, the z-index scale, breakpoints, ease curves and keyframes, and the contrast gate.

### Copy

Write what the user needs to act: the label, the value, the action. A form shows a hint (`FieldDescription`) when an input has rules or a format, such as password length or a date pattern; state the rule and nothing else. Whether a screen also carries taglines, secondary labels or supporting copy follows its direction. Ledger has none.

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
| Rule or format for an input (password length, date pattern) | FieldDescription inside Field | Placeholder text, Tooltip |
| Copy a link, key or ID | CopyButton | IconButton with your own clipboard code |
| Delete or discard one item without a modal | ConfirmButton | Dialog (keep Dialog for a decision with several fields or consequences) |
| Autosave, sync or background work: saving, saved, failed | AsyncStatus | Toast, a hand-made spinner |
| Verification code, 2FA or PIN | OtpInput | One Input per digit |
| Password entry | PasswordInput | Input with `type="password"` |
| Progress through a multi-step flow | Stepper | Tabs, Progress |
| Todo or setup steps being completed | Checklist | Loose Checkboxes |
| Like, star, bookmark or upvote with a count | ReactionButton | Button plus AnimatedNumber by hand |
| Unread count on a bell | NotificationBell | IconButton with a Badge |
| Content whose height changes (steps in a Dialog or Drawer, expanding forms) | AutoHeight | Animating `height` by hand |

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

Each animates only the change the user needs to notice, on the tiers above, with no loops and no entrance on page load (the one loop is the Spinner while work is pending). The first five are original to Fine. The ten from 0.4 take their ideas from Rare UI; the code is written from scratch on Fine's primitives and tiers.

| Animation | Where | Moves | Tier | Reduced motion |
|---|---|---|---|---|
| Digit roll | `AnimatedNumber`, pricing block price | Changed digit slides a line in the direction the value moved; added or removed digits and separators grow or shrink | moderate enter, moderate exit tween; unchanged digits stay put | fade only, no travel, no width, instant exit |
| Tag removal | `TagList` + `Tag` | Leaving tag fades and scales to 0.5, then is inert; siblings glide into the gap (position only) | fast exit; moderate glide | fade only, no scale, siblings jump |
| Slider track press | `Slider` | Thumb and range glide to the pressed spot; drag and keys stay instant | moderate (CSS, `data-glide`) | jump |
| Avatar image arrives | `Avatar` | Image fades in over the initials; a cached image shows at once | fast, `ease-enter` | fade kept |
| Theme switch | docs `ThemeToggle` | Page crossfades through a View Transition (`::view-transition-*(root)` in `app/globals.css`) | moderate | instant switch |
| Copy confirmation | `CopyButton` | Copy icon fades and scales to 0.5; a check enters at 0.5 to 1 while its stroke draws; reverts after `timeout`. A failed write shows a danger X | fast enter and exit; stroke draw moderate | crossfade, no scale or draw |
| Async status | `AsyncStatus` | Spinner, check (drawn) and danger X crossfade; the label rolls up a line to the new text | moderate; label on `spring.moderate`, exit on the moderate tween | label and icon crossfade, no travel or draw |
| Height glide | `AutoHeight` | Container height follows its content (CSS, first measure does not animate). With `transitionKey` the old view leaves inert and out of flow, the new one fades in | moderate glide; fast exit; moderate enter | height jumps, crossfade kept |
| Inline confirm | `ConfirmButton` | Danger button widens to the question with Cancel and Confirm, then collapses; the two faces crossfade, and both hug the end edge so Confirm lands where the trigger was | width `spring.moderate` and moderate exit; leaving face fast exit, arriving face moderate | width jumps, fades kept |
| Reaction press | `ReactionButton` | Icon fill fades in and the icon settles from 0.85 to 1; the count rolls | fast fill and press (`spring.fast`); count moderate | no scale; fill and count fade |
| Bell swing | `NotificationBell` | When `count` rises the bell swings once from its top pivot (about 12 degrees each way); a rise mid-swing carries on; the badge pops from scale 0; the count rolls. A fall never swings | expressive swing; fast badge; moderate count | no swing or pop; badge and count fade |
| Password reveal and meter | `PasswordInput` | Eye and eye-off swap with scale; meter segments fill left to right with a 40ms stagger in one status color per level | fast swap; moderate fill, moderate exit with no stagger | icons crossfade; segments fade in at full width, no stagger; color fade kept |
| Code slots | `OtpInput` | A typed digit rolls up into its slot, a deleted one rolls out downward; one ring slides between slots; `invalid` shakes the row (x 0, -6, 5, -3, 0); `state="success"` turns the borders success left to right, 40ms apart | moderate roll and slide; shake is a 240ms tween (slow tier's duration); fast border color | no roll, slide or shake; digit fades; color changes kept |
| Strike and glide | `Checklist` | After the check mark, a strike line draws across the label left to right and the label goes muted. With `moveCompletedToEnd` the item then glides to the end (the DOM is reordered) | fast mark, moderate strike (80ms delay), moderate retract; glide `spring.moderate` | strike appears at once, glide is a jump; color fade kept |
| Step progress | `Stepper` | A completed step's marker becomes a check that draws; the connector fills from its start edge (scaleX, scaleY when vertical); the current ring travels to the next marker | fast check; moderate connector and ring (`spring.moderate`) | check, fill and ring jump; marker fades kept |

Screen readers get the final value or name on the same frame: `AnimatedNumber` keeps an sr-only copy of the formatted value and aria-hides the rolling glyphs; the leaving tag is `inert`; the avatar name moves to the image at once. The new components follow the same rule: `CopyButton` and `NotificationBell` flip their accessible name in the commit that changes the state and add a polite live region; `AsyncStatus` is a polite `role="status"` whose sr-only copy holds the new text while the rolling copy is aria-hidden; `ReactionButton` renames itself ("Like, 12" to "Like, 13") on the frame of the press; the view `AutoHeight` is replacing is `inert`.

### Accessibility contracts

- Base UI supplies roles, keyboard and focus management; keep its parts, do not re-implement them. Tests pin: dialog traps focus and returns it on Escape; menu arrows and highlight; tabs arrows, Home, End; combobox label focuses input; a Field hint resolves through the input's `aria-describedby`; drawer, command palette, accordion, pagination, navbar-at-375px keyboard paths (`tests/keyboard.spec.ts`).
- Icon-only controls take `label` (IconButton). Danger Alert uses `role="alert"`, the rest `role="status"`.
- The ten 0.4 components pin their paths in `tests/anim-feedback.spec.ts`, `anim-actions.spec.ts`, `anim-forms.spec.ts` and `anim-progress.spec.ts`, each with its pages in the axe scans. `CopyButton`: the name flips to "Copied" or "Copy failed" with the icon. `ConfirmButton`: focus moves to Cancel on open; Cancel, Escape and a finished confirm return it to the trigger; the question is a labelled group and the hidden face is inert; Confirm shows `loading` while `onConfirm` is pending. `ReactionButton`: an `aria-pressed` toggle named "Label, count". `NotificationBell`: "Notifications, 3 unread", 99+ above 99. `PasswordInput`: the toggle is named "Show password" or "Hide password" with `aria-pressed` and flips the input type with them; the strength label is `aria-live="polite"` and merged into the input's `aria-describedby`, beside a `FieldDescription`. `OtpInput`: one real `autoComplete="one-time-code"` input drives aria-hidden slots, works with `FieldLabel`, takes digits only, fills every slot on paste (also "123-456"), and calls `onComplete` once per new full code. `Checklist`: built on Checkbox, Space toggles, focus stays on an item that moves, and the DOM order matches the visual order. `Stepper`: an `<ol>`, `aria-current="step"` on the current step, "completed" in the name of finished steps.
- Every preset meets these: every semantic text pair is at least 4.5:1, input and ring borders at least 3:1 (WCAG 1.4.11), accent at least 3:1 on background and surface, accent and a chromatic primary at least 40 degrees of hue from danger; `npm run tokens` fails otherwise. Axe scans every docs page in both schemes, under the default preset (`tests/a11y.spec.ts`).

## Changing Fine

### Layout

```
components/ui/*.tsx      one file per component; installs to the same path
components/blocks/*.tsx  compositions of components/ui only
lib/                     utils (cn) · popup · fluid-hover · motion (generated)
styles/                  fine.css (Ledger and the Tailwind mapping), presets/<name>.css, presets.css, tokens.json (all generated)
scripts/                 tokens.mjs · presets/<name>.mjs (one per preset) · registry.mjs · verify-install.mts · check-snippets.mts · check-classes.mts · serve.mjs · screenshots.mts · motion-tour.mts · launch-assets.mts
site/                    docs-only: nav.ts, examples/<slug>.tsx, presets.ts (fonts per preset), preset-switch.tsx, source.ts, install-command.tsx, chrome
app/                     docs routes: /, /tokens, /components/[slug], /blocks/[slug]
tests/                   keyboard, motion, a11y, layout and anim-* (the ten 0.4 components) specs against out/; helpers/motion.ts holds the shared per-frame helpers
plugin/, .claude-plugin/ Claude Code plugin (skills/fine-design/SKILL.md, .mcp.json) and its marketplace.json; the skill restates AGENTS.md's using rules, so edit both
registry.json, public/r/*, public/llms.txt   generated by registry:build
```

Never hand-edit `styles/fine.css`, `styles/presets/`, `styles/presets.css`, `styles/tokens.json`, `lib/motion.ts`, `registry.json`, `public/r/`, `public/llms.txt`. Edit the source and regenerate.

### Add a component, end to end

1. `components/ui/<name>.tsx`: Base UI primitive underneath, `cva` for `variant` and `size`, semantic and preset utilities from the contract table only (no raw hex, no fixed control heights or radii), `focus-visible:focus-ring`, `"use client"` when it uses hooks. Copy the shape of `button.tsx` or `badge.tsx`. A new file per feature; no growing existing files.
2. Motion only if a source animation maps onto a tier or it is the change the user needs to notice (see Motion). Otherwise static, and say so in the doc comment, as `badge.tsx` does.
3. `site/examples/<name>.tsx`: each exported function is one live example and its source is the copyable snippet. Imports must be complete; module-level helpers it references are pulled in automatically.
4. `site/nav.ts`: add the entry (slug, title, `load`). Blocks also take `exportName` and `frame`.
5. `scripts/registry.mjs`: add the category and one-line description in `UI` (or `BLOCKS`). The script throws when a file has no entry or no nav.ts entry, imports an unknown `@/` path, or imports a package missing from `package.json`.
6. `npm run typecheck && npm run check:classes && npm run check:snippets && npm run build`, then `npm test`.

### Token pipeline

`scripts/tokens.mjs` is the machinery: OKLCH math, `PAIRS` (the contrast gate), `MOTION`, breakpoints, ease curves and the emitters. It discovers `scripts/presets/*.mjs`, checks each file's shape (an error names the preset and the missing key), then runs the sRGB gamut check, every `PAIRS` entry and the accent/danger gate per preset. It writes `styles/fine.css` (Ledger plus the Tailwind mapping), `styles/presets/<name>.css`, `styles/presets.css`, `styles/tokens.json` and `lib/motion.ts`, and exits 1 on any pair under its minimum or any color outside sRGB; failure lines start with the preset name. Change a value in a preset file, run `npm run tokens`, and read the pass line it prints. A new semantic color needs its `PAIRS`.

The accent/danger gate sits next to the contrast gate (`HUE_GATE` in `tokens.mjs`). Per preset and mode, `accent` and `primary` must sit at least 40 degrees of OKLCH hue from `danger` whenever their chroma is 0.04 or more, so a positive balance in the accent never looks like an error; a grey primary is under the chroma floor and exempt. A failure prints `FAIL <preset> <mode> accent vs danger: hue 22 and 22 are 0° apart (min 40° ...)`, and every run prints a pass line per preset and mode. The fix is a ramp of the accent's own in the preset's `palette.hues` (Folio's `plum`, Poster's `magenta`), not a looser gate. `registry.mjs` takes the primitive names from each preset's `tokens.json` entry, so a preset's own ramp needs no registry change.

`scripts/registry.mjs` turns the output into registry items. `fine-base` carries the mappings, utilities and Ledger defaults in `@layer base`. Each `styles/presets/<name>.css` becomes `theme-<name>` automatically, with its fonts parsed into `meta.fonts`. Semantic colors sit in the `css` field on purpose: a `cssVars` write would never overwrite the consumer's `--input` and `--ring` after `shadcn init`.

### Making a preset

1. Copy `scripts/presets/ledger.mjs` to `scripts/presets/<name>.mjs`. `name` must equal the file name and every key is required: palette, semantic (light and dark), fonts, figureAdvance, weights, text, radius, borderWidth, control, padding, shadows (`raised`, `control` and `overlay` among them). `fontOptions` is optional. `figureAdvance` is what the figure face measures (a digit, in em); `tests/layout.spec.ts` fails a value below it, and fails any preset whose figures leave their card. Edit it in the section order the file follows.
2. Fonts: write each non-contract family as `var(--font-<id>, "<Family>")` with a quoted fallback. Add a `next/font/google` loader with `variable: "--font-<id>"` and `preload: false` to the preset's section in `site/presets.ts`, list it in the preset's `fonts`, and add the preset to `presets`. If a face needs an `axes` or a fixed `weights` list to load properly, declare it in the preset's `fontOptions` under its variable and pass the same `axes` or `weight` in the loader; theme `meta.fonts` carries it to installed projects, and `npm run registry:build` throws when a preset reads a font variable with no loader or a loader whose options differ.
3. `npm run tokens`. Every pair in `PAIRS` must pass in light and dark: text 4.5:1, input and ring borders 3:1, accent 3:1 on background and surface, and the accent and a chromatic primary 40 degrees or more from danger in hue. Fix the values, never the gate.
4. `npm run build` derives `theme-<name>`; `npm run verify:install` proves it installs and renders. Look at the pages in the new preset with `node scripts/screenshots.mts`.

A preset changes appearance only. It cannot change roles, keyboard paths, validation, motion tiers or the focus ring.

### Motion rules and sources

- Tiers come from Fluid Functionalism (MIT); expressive is Rare UI's SEND spring. easyui's SlidePagination technique drives the pagination indicator. Credits table is in `README.md`. The first five animations in Fine's own animations above are original, not borrowed; do not credit them. The exception is the ten 0.4 components: each names Rare UI as the source of its idea in its doc comment, the README credits table says so, and no Rare UI code is copied (its license does not clearly cover repackaging code inside a library).
- Port a source animation onto the nearest tier. Do not invent durations or bounce values in a component. A new original animation is allowed only for a change the user needs to notice; list it in Fine's own animations, state tier and reduced-motion behaviour in its one doc comment, and never block input, delay content or change an accessible name mid-animation.
- `ease-spring-expressive` is the settle curve of the same underdamped spring Motion runs, generated in `tokens.mjs`.
- Shared helpers for per-frame cases live in `tests/helpers/motion.ts` (`motionCases`, `record`, `open`); the `tests/anim-*.spec.ts` group specs use them. A per-frame test of a staggered CSS color compares canvas pixels, not serialized colors: Chrome changes a transitioning color's serialization (lab to oklab) at the start of its delay, which reads as a false change. Motion JS springs and WAAPI opacity cannot be slowed with Chrome's animation playback rate, so their cases run at 1x and sample 60 to 160ms; `anim-feedback.spec.ts` sets `retries: 2` for that reason, and a real regression fails every attempt.
- `tests/motion.spec.ts` samples computed styles per frame to prove each animation uses its token and that movement becomes a jump under reduced motion. Add a case for any new animation.

### Ledger

Ledger's look is decided and final. It applies to Ledger, and to the docs site while Ledger is selected. Folio and Poster have their own directions. The docs chrome is built from the preset utilities, so it takes on whichever preset is selected.

- Ink chrome (primary, focus ring), grey secondary, cobalt accent on a screen's main data element only, never chrome and never a second element per screen.
- Geist plus `figures`; labels and body in sentence case.
- 6px and 8px radii, flat at rest (`shadow-raised` is none; shadows belong to overlays).
- No taglines, secondary labels or explanatory helper text. The exception is `FieldDescription` on an input with a rule or format.
- No gradients, neon or decorative color. No alternative typefaces.
- Input borders stay at 3:1 or better.

Match the file you are editing; comments are sparse and say why.

### Verify

| Command | Proves |
|---|---|
| `npm run tokens` | Contrast pairs, the accent/danger hue gate and sRGB gamut for every preset; regenerates CSS, JSON, motion |
| `npm run typecheck` | The repo compiles |
| `npm run check:snippets` | Every copyable docs snippet compiles as its own file |
| `npm run check:classes` | No class in `components/`, `site/` or `app/` bypasses the token contract: bare `border` widths, `font-medium`, `font-semibold`, `font-bold`, `rounded` and `rounded-xs` to `rounded-3xl`, and `h-7`, `h-9`, `h-10` in `components/`. Exceptions live in the script's allow-list, each with a reason |
| `npm run build` | tokens, registry (68 items) and the static export in `out/` |
| `npm test` | 373 tests: keyboard paths, per-frame motion (including the ten 0.4 components in `tests/anim-*.spec.ts`), axe, figures inside their cards at every width under every preset, against `out/` on port 4329 (build first) |
| `npm run verify` | build, typecheck, classes, snippets, Playwright in one go |
| `npm run verify:install` | `theme-folio`, then select and dialog, install into a fresh Next app and render with Folio's tokens and motion while the app's own `:root` values survive; a second phase installs `fine-base` alone and checks the Ledger defaults give way to the project in every color mode; needs network and a prior build (temp app path is printed); after a deploy built with `REGISTRY_URL=https://…`, it installs from the live registry instead |
| `node scripts/screenshots.mts [states]` | Pages at 375 and 1440, light and dark, for a visual look |
| `node scripts/motion-tour.mts` | Motion video tour (needs ffmpeg) |
| `node scripts/showcase-video.mts` | Promo reel of `/showcase` (unlisted payments app), 1920x1080 at 60fps → `screenshots/x/` (build first; needs ffmpeg) |
| `node scripts/launch-assets.mts gif\|themes\|preview\|icon\|all [--out dir]` | The README and listing assets: `docs/demo.gif` (first 9.9s of the film, 720px, 14fps), `docs/themes.png` and `docs/social-preview.png` (the showcase in all three presets at 1200px, 2x), `plugin/.claude-plugin/icon.png`; serves `out/` itself (build first; needs ffmpeg, and `fine-film.mp4` for the gif) |
| `node scripts/render-film.mts [--path /film/v03/] [--from s --to s --out f.mp4 \| --stills t1,t2 [--jump]]` | Films rendered on a virtual clock so every frame is exact and repeatable, 1920x1080 at 60fps: `/film` (`site/film/`) → `screenshots/x/fine-film.mp4`, `/film/v03/` (`site/film03/`, the 0.3 release; `PresetScope` gives a subtree a whole preset) → `screenshots/x/fine-0.3.mp4`, `/film/v04/` (`site/film04/`, the 0.4 release; each macro exports framable `Content` and `anchors`, and `Shot` frames it at any zoom with CSS `zoom`) → `screenshots/x/fine-0.4.mp4`. The duration comes from the page; `--jump` reaches a late still in coarse steps (build first; needs ffmpeg) |

A registry change is proven by `npm run verify:install` (fresh Next app, `shadcn init`, `add --overwrite`, build, browser checks) plus a look at `screenshots/install/`; the registry JSON alone proves nothing. Specs wait on `html[data-hydrated]`; a new interactive page keeps that signal.
