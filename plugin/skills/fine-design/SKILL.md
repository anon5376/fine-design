---
name: fine-design
description: Use when building or restyling React UI in a project that uses Fine (fine-design, @fine/ components, fine-theme), or when asked to install or use Fine components. Fine is a shadcn registry on Base UI, Tailwind v4 and Motion with an ink-and-cobalt "achromatic ledger" look.
---

# Fine

React design system as a shadcn registry. 42 components, 7 blocks, 4 lib files, `fine-theme`. Site: https://fine-design.qeqx.chatgpt.site

## Setup

Needs React 19, Tailwind v4, and a shadcn `components.json` with the default aliases (`@/components`, `@/components/ui`, `@/lib`). Run `npx shadcn@latest init` first if the project has none.

1. Register the namespace in `components.json`:
   ```json
   "registries": { "@fine": "https://fine-design.qeqx.chatgpt.site/r/{name}.json" }
   ```
2. Add items: `npx shadcn@latest add @fine/button @fine/dialog`. Each item brings its dependencies: other items, `fine-theme`, npm packages.
3. After `shadcn init`, add `--overwrite` once: init wrote its own `components/ui/button.tsx` and `lib/utils.ts`, and Fine's versions replace them (icon-button and dialog build on Fine's button API).
4. `fine-theme` writes tokens into `app/globals.css` (semantic colors in `:root` and `.dark`, `@theme inline`, the `figures` and `focus-ring` utilities, motion scalars). It keeps Tailwind's palette. Re-adding any item re-applies Fine's values to the first `:root` and `.dark` rule, so put overrides in a later rule.
5. Load Geist as `--font-geist-sans` and `--font-geist-mono` (`next/font`).
6. App root: `<MotionConfig reducedMotion="user">` and one `<Toaster />`. `TooltipProvider` is optional.

Done when the page renders with Fine's ink buttons and Geist type and the dev server logs no import errors.

## Discovery

Read https://fine-design.qeqx.chatgpt.site/llms.txt for the per-item list (description, docs URL, registry URL). It also has the conventions below in short form.

- `npx shadcn@latest search @fine`, then `npx shadcn@latest view @fine/<name>` for the source and files of one item. Fine items list their exports and variants in `meta`.
- The shadcn MCP server (`npx shadcn@latest mcp`) exposes the same search, view and add to agents. This plugin starts it; elsewhere, add it to the agent's MCP config.
- Read an item's exports and variants before guessing a prop.

## Rules agents get wrong

**Tokens.** Use semantic utilities only: `bg-background`, `bg-surface`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`, `bg-primary`, `bg-secondary`, and `success`, `warning`, `danger`, `info` (each with `-foreground`, `-subtle`, `-subtle-foreground`). Radii `rounded-control` (6px), `rounded-container` (8px), `rounded-pill`. A raw hex or palette step (`bg-blue-500`) is a bug even where Tailwind's palette still exists.

**Ink and cobalt.** Chrome is ink: the primary button and the focus ring (`focus-visible:focus-ring`) are near-black, near-white in dark. `accent` (cobalt) marks the one main data element of a screen: a chart's current series, a selected value. One per screen, never chrome. Resting surfaces are flat; `shadow-overlay` belongs to overlays.

**Figures.** Money, counts, IDs and addresses take the `figures` utility (Geist Mono, tabular digits). Labels and body stay Geist, sentence case.

**Copy.** Taglines, helper text and secondary labels do not exist in this system. Write the label, the value, the action. No gradients, neon or decorative color.

**Dark mode.** `.dark` or `.light` on `<html>` or any subtree; with neither, the OS decides. `dark:` follows the same rule.

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
- Fine's own (original): `AnimatedNumber` digit roll (also the pricing price), `TagList` removal exit and sibling glide, `Slider` track-press glide, `Avatar` image fade. Use `AnimatedNumber` for a figure that changes while on screen; wrap removable `Tag`s in `TagList`. Never add loops or page-load entrances.
- Reduced motion drops travel and keeps fades: `MotionConfig reducedMotion="user"` for Motion, `motion-reduce:` for CSS.

## Accessibility contracts

- Base UI supplies roles, keyboard and focus. Keep its parts; re-implementing them breaks the tested paths (dialog focus trap and return, menu arrows, tabs Home/End, combobox label focus).
- Combobox goes inside `Field` with a `FieldLabel` before it; the label focuses the input.
- Mount `<Toaster />` once, then call `toast.add({ title, type })` from anywhere.
- Icon-only controls take `label` (IconButton). Danger Alert uses `role="alert"`, the others `role="status"`.
- Text pairs stay at 4.5:1 and input borders at 3:1; take colors from tokens and the contrast holds.
