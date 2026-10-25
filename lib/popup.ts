// Shared by every floating surface (Select, Combobox, DropdownMenu, Popover) so they look and move alike.

export const popupSurface = "rounded-container border-line border-border bg-surface text-foreground shadow-overlay outline-none"

/**
 * Fluid Functionalism popup motion (springs.ts puts dropdowns on the moderate tier): enters on it from
 * opacity 0, scaleY 0.96 and, above or below the anchor, a 4px slide; exits back to that pose on the
 * fast tier's exit. Origin follows Base UI's collision-aware side. Instant opens and closes (data-instant) skip it.
 */
export const popupMotion = [
  "origin-(--transform-origin) transition-[opacity,scale,translate] duration-(--duration-moderate) ease-spring-moderate data-instant:transition-none",
  "data-starting-style:scale-y-96 data-starting-style:opacity-0 data-ending-style:scale-y-96 data-ending-style:opacity-0",
  "data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=bottom]:data-ending-style:-translate-y-1",
  "data-[side=top]:data-starting-style:translate-y-1 data-[side=top]:data-ending-style:translate-y-1",
  "data-ending-style:duration-(--duration-fast-exit) data-ending-style:ease-exit",
].join(" ")

/**
 * Fluid Functionalism tooltip motion (spring.fast): opacity and a 4px slide from the trigger's side,
 * no scale; the exit is a plain fade on the fast tier's exit.
 */
export const tooltipMotion = [
  "transition-[opacity,translate] duration-(--duration-fast) ease-enter data-instant:transition-none",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  "data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=top]:data-starting-style:translate-y-1",
  "data-[side=left]:data-starting-style:translate-x-1 data-[side=right]:data-starting-style:-translate-x-1",
  "data-ending-style:duration-(--duration-fast-exit) data-ending-style:ease-exit",
].join(" ")

/** Rows inside a popup. The gliding highlight sits behind them, so rows stay transparent. */
export const popupItem =
  "relative flex h-8 cursor-default select-none items-center gap-2 rounded-control px-2 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
