// Shared by the server step that writes the scope CSS (preset-css.ts) and the client component that uses it (preset-scope.tsx).
export const PRESET_IDS = ["ledger", "folio", "poster"] as const
export type PresetId = (typeof PRESET_IDS)[number]
export type Scheme = "light" | "dark"
