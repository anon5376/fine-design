---
name: fine-design
description: Use when building or restyling React UI in a project that uses Fine (fine-design, @fine/ components, theme-ledger, theme-folio, theme-poster), or when asked to install or use Fine components. Fine is a shadcn registry on Base UI, Tailwind v4 and Motion. Behavior is the same everywhere; appearance is a preset (Ledger, Folio, Poster).
---

# Fine

React design system as a shadcn registry. 52 components, 7 blocks, 4 lib files, `fine-base` and 4 theme items. Site: https://fine-design.qeqx.chatgpt.site

Behavior is universal: Base UI roles, keyboard and focus, validation, reduced motion, the motion tiers, the accessibility contracts, and styling through tokens only. Appearance is a preset: Ledger, Folio or Poster, each a set of token values.

## Direction first

Before building a new site, page or screen, settle the direction. Read the project's design doc if it has one (`DESIGN.md` or similar). Otherwise decide these from the brief and write them into a short `DESIGN.md` first: audience, content, typography, palette, composition, imagery, interaction character. Then pick the closest preset, or derive a new one (see Making a preset), and build with Fine components.

Use Ledger when the user asks for it, or when the job is a dense data or operations tool. A small edit inside an existing screen follows that screen's direction; skip this step for it.

| Preset | Direction | Take it for |
|---|---|---|
| Ledger | Achromatic, dense, flat at rest, ink chrome with one cobalt accent | Dashboards, admin and finance tools |
| Folio | Editorial, set for reading: warm paper, serif titles, one quiet aubergine accent | Docs, publications, content-led pages |
| Poster | Loud, large type, strong contrast: a flat hot magenta for the main action and the accent, hard shadows | Launches, campaigns, marketing pages |

The table states each preset's intent. The values are in the theme item (`npx shadcn@latest view @fine/theme-<name>`) and in `scripts/presets/<name>.mjs` in the Fine repo.

## Setup

Needs React 19, Tailwind v4, and a shadcn `components.json` with the default aliases (`@/components`, `@/components/ui`, `@/lib`). Run `npx shadcn@latest init` first if the project has none.

Install a theme once, then components. A component never re-skins a project.

1. Register the namespace in `components.json`:
   ```json
   "registries": { "@fine": "https://fine-design.qeqx.chatgpt.site/r/{name}.json" }
   ```
2. Install one theme: `npx shadcn@latest add @fine/theme-ledger` (or `theme-folio`, `theme-poster`). It writes values only (colors, fonts, weights, radii, type scale, control sizes, padding, border width, shadows) to `:root`, `.light`, `.dark` and the OS dark query. A second theme replaces the first; put overrides in a later rule. `fine-theme` is an alias of `theme-ledger`. Tailwind's palette stays.
3. Add components: `npx shadcn@latest add @fine/button @fine/dialog`. Each depends on `fine-base` (the `@theme inline` mappings, the `figures`, `figure-fit`, `focus-ring` and `border-line` utilities, keyframes, motion scalars, and Ledger defaults in `@layer base`) plus other items and npm packages. Your `:root` and the installed theme beat those defaults, so adding a component later does not change the look. With no theme installed, components render in Ledger.
4. After `shadcn init`, add `--overwrite` once: init wrote its own `components/ui/button.tsx` and `lib/utils.ts`, and Fine's versions replace them (icon-button and dialog build on Fine's button API). Fine's `cn` knows the preset utilities, so `h-control-md` and `h-12` merge.
5. Load the fonts in the theme item's `meta.fonts` with next/font, one CSS variable each, passing an entry's `axes` or `weights` (as `axes` and `weight`) when it lists them: Folio's Newsreader and Poster's Bricolage Grotesque list `opsz`, and load as a static cut without it. Ledger needs Geist as `--font-geist-sans` and `--font-geist-mono`.
6. App root: `<MotionConfig reducedMotion="user">` and one `<Toaster />`. `TooltipProvider` is optional.

Done when the page renders in the chosen preset's colors and type and the dev server logs no import errors.

## Discovery

Read https://fine-design.qeqx.chatgpt.site/llms.txt for the per-item list (description, docs URL, registry URL). It also has the conventions below in short form.

- `npx shadcn@latest search @fine`, then `npx shadcn@latest view @fine/<name>` for the source and files of one item. Fine items list their exports and variants in `meta`.
- The shadcn MCP server (`npx shadcn@latest mcp`) exposes the same search, view and add to agents. This plugin starts it; elsewhere, add it to the agent's MCP config.
- Read an item's exports and variants before guessing a prop.

## Rules agents get wrong

**Tokens.** Use semantic and preset utilities only. Surfaces and text: `bg-background`, `bg-surface`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`. Fills: `bg-primary`, `bg-secondary`, and `success`, `warning`, `danger`, `info` (each with `-foreground`, `-subtle`, `-subtle-foreground`). Shape and type: `rounded-control`, `rounded-container`, `rounded-small`, `rounded-pill`; `h-control-sm|md|lg`; `px-pad-control-*`, `px-pad-field-*`, `p-pad-container-*`; `border-line` and its directional forms; `font-label`, `font-title`, `font-strong`, `font-display`; `shadow-raised` for resting surfaces, `shadow-control` for a control's own lift (the selected tab) and `shadow-overlay` for popups. A raw hex, a palette step (`bg-blue-500`), a fixed height like `h-9` on a control, or a literal `rounded-md` is a bug even where Tailwind's palette still exists: it breaks when the preset changes.

**Focus and dark mode.** `focus-visible:focus-ring` on anything focusable. Dark mode is `.dark` or `.light` on `<html>` or any subtree; with neither, the OS decides. `dark:` follows the same rule. Every preset defines both modes.

**Figures.** Money, counts, IDs and addresses take the `figures` utility (the preset's figure face with tabular digits). A stat figure in a card also takes `figure-fit`, inside a parent that is `@container` and sets the size (`text-xl`): the figure keeps that size when it fits and shrinks when the card or the face is too narrow. Set `--figure-chars` on the grid to the longest figure's length (default 12).

**Accent.** `accent` marks emphasis on data. How many a screen carries is the preset's call. Ledger allows one, on the main data element, never on chrome. Every preset keeps its accent (and a chromatic primary) 40 degrees or more of hue from `danger`, so an accent never reads as an error.

**Copy.** Write what the user needs to act: the label, the value, the action. A form shows a hint when an input has rules or a format (password length, date pattern): `FieldDescription` inside `Field`, stating the rule and nothing else. Whether a screen also has taglines or secondary labels follows its direction.

## Ledger

Ledger's decided look, for Ledger and nothing else: ink chrome (primary, focus ring), grey secondary, cobalt accent on a screen's main data element only, Geist plus `figures`, 6px and 8px radii, flat at rest. No taglines, secondary labels or explanatory helper text, except a `FieldDescription` on an input with a rule or format. No gradients, neon, decorative color or alternative typefaces.

## Making a preset

1. Copy `scripts/presets/ledger.mjs` to `scripts/presets/<name>.mjs` in the Fine repo. `name` equals the file name; every key is required (palette, semantic light and dark, fonts, weights, text, radius, borderWidth, control, padding, shadows); `fontOptions` is optional.
2. Write each non-contract font as `var(--font-<id>, "<Family>")` and add its `next/font/google` loader (`variable: "--font-<id>"`, `preload: false`) to `site/presets.ts`. If a face needs `axes` or a fixed `weights` list, declare it in `fontOptions` under its variable and pass the same `axes` or `weight` in the loader; the registry build throws when a font has no loader or the options differ.
3. Run `npm run tokens`. Every pair must pass: text 4.5:1, input and ring borders 3:1, accent 3:1 on background and surface, accent and a chromatic primary 40 degrees or more from danger in hue, all colors inside sRGB. Give the accent a ramp of its own in `palette.hues` if it is too close to red. Fix the values, not the gate.
4. `npm run build` derives `theme-<name>`; `npm run verify:install` proves it installs and renders.

A preset cannot change roles, keyboard paths, validation, motion tiers or the focus ring.

## Variant API

- `variant` and `size` props via cva; defaults live in each file's `defaultVariants`. Button variants: primary, secondary, outline, ghost, danger; sizes sm, md, lg. `loading` keeps the label width and blocks clicks.
- Each `<name>Variants()` export styles another element: `<a className={buttonVariants({ variant: "outline" })}>`. `render={<a href="/x" />}` swaps the element. Merge classes with `cn` from `@/lib/utils`.
- Badge and Alert share neutral plus the four statuses. IconButton requires `label`.

## Which component

| Job | Use | Not |
|---|---|---|
| Blocking decision or short form | Dialog | Drawer |
| Secondary panel, filters, mobile nav | Drawer | Dialog |
| Anchored detail or small form | Popover | Dialog |
| One value, short list | Select | Combobox |
| One value, long list with search | Combobox | Select |
| Actions on an item | DropdownMenu | Select |
| Global actions by keyboard (Meta+K) | CommandPalette | DropdownMenu |
| Persistent message in the page | Alert | Toast |
| Transient confirmation | `toast.add({ title, type })` | Alert |
| Status of a record | Badge | Tag |
| Chosen value or filter, removable | Tag | Badge |
| Same-page panels | Tabs | Sidebar |
| Site or app navigation | Navbar, Sidebar, Breadcrumb, Pagination | Tabs |
| Form with validation | Form, Field, FieldLabel, FieldError | bare Input |
| Rule or format for an input | FieldDescription inside Field | Placeholder text, Tooltip |
| Copy a link, key or ID | CopyButton | IconButton with your own clipboard code |
| Delete or discard one item without a modal | ConfirmButton | Dialog (keep Dialog for several fields or consequences) |
| Autosave, sync or background work: saving, saved, failed | AsyncStatus | Toast, a hand-made spinner |
| Verification code, 2FA or PIN | OtpInput | One Input per digit |
| Password entry | PasswordInput | Input with `type="password"` |
| Progress through a multi-step flow | Stepper | Tabs, Progress |
| Todo or setup steps being completed | Checklist | Loose Checkboxes |
| Like, star, bookmark or upvote with a count | ReactionButton | Button plus AnimatedNumber by hand |
| Unread count on a bell | NotificationBell | IconButton with a Badge |
| Content whose height changes (steps in a Dialog or Drawer, expanding forms) | AutoHeight | Animating `height` by hand |

Blocks (`auth-form`, `hero`, `feature-grid`, `pricing`, `faq`, `footer`, `dashboard-shell`) compose `components/ui` only. Install one as a start, then edit it.

## Motion

Static is the default. Add motion only when a component already ships it, a source animation maps onto a tier, or it is the one change the user needs to notice. Alert, Badge, the Navbar wordmark, a Tag outside `TagList`, and slider drag and key steps stay static: a state change there is read from the new label, and animating them is a regression.

Pick the tier by what moves; the bigger the thing, the slower the tier.

| Tier | Enter | Exit | Use |
|---|---|---|---|
| fast | 80ms | 60ms | hover, focus, check and radio marks, tooltips, hover highlight, avatar image fade, tag removal exit |
| moderate | 160ms | 120ms | select, combobox, menu and popover enters, drawers, tab and pagination indicators, switch thumb, rolling digits, tag sibling glide, slider track-press glide |
| slow | 240ms, bounce 0.12 | 160ms | dialogs, command palette |
| expressive | 420ms visual, bounce 0.28 | 160ms | feedback arriving: toasts and the hero slips. The one overshoot |

- Motion JS: enter on `spring.<tier>`, exit on `spring.<tier>.exit` with `easing.exit`, both from `@/lib/motion`. CSS: `duration-(--duration-<tier>)` with `ease-spring-<tier>` to enter; `duration-(--duration-<tier>-exit)` with `ease-exit` to leave. Use these tokens in place of invented durations or bounce values.
- Lists, menus and nav share one hover highlight: `useFluidHover` and `<FluidHighlight>` from `@/lib/fluid-hover`. Popups use `popupSurface`, `popupMotion`, `popupItem` from `@/lib/popup`.
- Animate transform and opacity. Width moves only where size is the information (progress fill, switch thumb, highlight, a figure gaining a digit, slider position).
- Fine's own (original): `AnimatedNumber` digit roll (also the pricing price), `TagList` removal exit and sibling glide, `Slider` track-press glide, `Avatar` image fade. Use `AnimatedNumber` for a figure that changes while on screen; wrap removable `Tag`s in `TagList`.
- Ready-made motion for everyday changes, from 0.4. Use these instead of animating by hand: `CopyButton` (drawn check, then reverts), `AsyncStatus` (spinner, check or X, label rolls), `AutoHeight` (height glides; pass `transitionKey` to crossfade swapped views, padding on the children), `ConfirmButton` (widens into the question), `ReactionButton` (fill, press, rolling count), `NotificationBell` (swings once when `count` rises, the one overshoot), `PasswordInput` (reveal swap, strength meter from `strength` 0 to 4 or a `scorer`), `OtpInput` (slots roll, ring slides, `invalid` shakes, `state="success"`), `Checklist` (strike line, `moveCompletedToEnd` glides the item), `Stepper` (check draws, connector fills, ring moves). Each is static on first render and falls back to fades under reduced motion. Never add loops or page-load entrances.
- Reduced motion drops travel and keeps fades: `MotionConfig reducedMotion="user"` for Motion, `motion-reduce:` for CSS.

## Accessibility contracts

- Base UI supplies roles, keyboard and focus. Keep its parts; re-implementing them breaks the tested paths (dialog focus trap and return, menu arrows, tabs Home/End, combobox label focus).
- Combobox goes inside `Field` with a `FieldLabel` before it; the label focuses the input.
- `FieldDescription` goes between the control and `FieldError`; Base UI links it to the input through `aria-describedby`, so the hint is read with the label.
- Mount `<Toaster />` once, then call `toast.add({ title, type })` from anywhere.
- Items that change state keep the accessible name in step with the visuals: `CopyButton`, `ReactionButton` and `NotificationBell` rename themselves in the commit that changes the state, and `AsyncStatus` is a polite `role="status"`. Do not wrap them in your own live region or relabel them mid-animation.
- `OtpInput` is one real input, so give it a `FieldLabel` inside `Field`; `PasswordInput` takes a `FieldDescription` beside its strength label; `ConfirmButton` moves focus to Cancel on open and back to its trigger on Cancel, Escape or confirm; `Checklist` items need stable keys; `Stepper` marks the current step with `aria-current="step"`.
- Icon-only controls take `label` (IconButton). Danger Alert uses `role="alert"`, the others `role="status"`.
- Every preset keeps text pairs at 4.5:1 and input borders at 3:1; take colors from tokens and the contrast holds.
