import type { ComponentType } from "react"

type ExampleModule = Record<string, ComponentType>
type Entry = { slug: string; title: string; load: () => Promise<ExampleModule> }

// One entry per docs page. Examples live in site/examples/<slug>.tsx: every
// exported function is one live example, and its source is the copyable code.
export const components: Entry[] = [
  { slug: "text", title: "Text", load: () => import("@/site/examples/text") },
  { slug: "heading", title: "Heading", load: () => import("@/site/examples/heading") },
  { slug: "icon", title: "Icon", load: () => import("@/site/examples/icon") },
  { slug: "layout", title: "Stack, Grid, Container", load: () => import("@/site/examples/layout") },
  { slug: "separator", title: "Separator", load: () => import("@/site/examples/separator") },
  { slug: "visually-hidden", title: "VisuallyHidden", load: () => import("@/site/examples/visually-hidden") },
  { slug: "button", title: "Button", load: () => import("@/site/examples/button") },
  { slug: "icon-button", title: "IconButton", load: () => import("@/site/examples/icon-button") },
  { slug: "input", title: "Input", load: () => import("@/site/examples/input") },
  { slug: "textarea", title: "Textarea", load: () => import("@/site/examples/textarea") },
  { slug: "select", title: "Select", load: () => import("@/site/examples/select") },
  { slug: "combobox", title: "Combobox", load: () => import("@/site/examples/combobox") },
  { slug: "checkbox", title: "Checkbox", load: () => import("@/site/examples/checkbox") },
  { slug: "radio", title: "Radio", load: () => import("@/site/examples/radio") },
  { slug: "switch", title: "Switch", load: () => import("@/site/examples/switch") },
  { slug: "slider", title: "Slider", load: () => import("@/site/examples/slider") },
  { slug: "label", title: "Label", load: () => import("@/site/examples/label") },
  { slug: "field", title: "Field", load: () => import("@/site/examples/field") },
  { slug: "card", title: "Card", load: () => import("@/site/examples/card") },
  { slug: "badge", title: "Badge", load: () => import("@/site/examples/badge") },
  { slug: "avatar", title: "Avatar", load: () => import("@/site/examples/avatar") },
  { slug: "tag", title: "Tag", load: () => import("@/site/examples/tag") },
  { slug: "kbd", title: "Kbd", load: () => import("@/site/examples/kbd") },
  { slug: "animated-number", title: "AnimatedNumber", load: () => import("@/site/examples/animated-number") },
  { slug: "table", title: "Table", load: () => import("@/site/examples/table") },
  { slug: "skeleton", title: "Skeleton", load: () => import("@/site/examples/skeleton") },
  { slug: "progress", title: "Progress", load: () => import("@/site/examples/progress") },
  { slug: "empty-state", title: "EmptyState", load: () => import("@/site/examples/empty-state") },
  { slug: "alert", title: "Alert", load: () => import("@/site/examples/alert") },
  { slug: "toast", title: "Toast", load: () => import("@/site/examples/toast") },
  { slug: "tooltip", title: "Tooltip", load: () => import("@/site/examples/tooltip") },
  { slug: "dialog", title: "Dialog", load: () => import("@/site/examples/dialog") },
  { slug: "drawer", title: "Drawer", load: () => import("@/site/examples/drawer") },
  { slug: "popover", title: "Popover", load: () => import("@/site/examples/popover") },
  { slug: "dropdown-menu", title: "DropdownMenu", load: () => import("@/site/examples/dropdown-menu") },
  { slug: "command-palette", title: "CommandPalette", load: () => import("@/site/examples/command-palette") },
  { slug: "tabs", title: "Tabs", load: () => import("@/site/examples/tabs") },
  { slug: "breadcrumb", title: "Breadcrumb", load: () => import("@/site/examples/breadcrumb") },
  { slug: "pagination", title: "Pagination", load: () => import("@/site/examples/pagination") },
  { slug: "navbar", title: "Navbar", load: () => import("@/site/examples/navbar") },
  { slug: "sidebar", title: "Sidebar", load: () => import("@/site/examples/sidebar") },
  { slug: "accordion", title: "Accordion", load: () => import("@/site/examples/accordion") },
]

// Blocks render components/blocks/<slug>.tsx directly. `frame` sizes the docs box around them:
// center (default) pads and centers, full runs edge to edge, app is full width at a fixed height.
export type BlockFrame = "center" | "full" | "app"
export const blocks: (Entry & { exportName: string; frame?: BlockFrame })[] = [
  { slug: "auth-form", title: "Auth form", exportName: "AuthForm", load: () => import("@/components/blocks/auth-form") },
  { slug: "hero", title: "Hero", exportName: "Hero", frame: "full", load: () => import("@/components/blocks/hero") },
  { slug: "feature-grid", title: "Feature grid", exportName: "FeatureGrid", frame: "full", load: () => import("@/components/blocks/feature-grid") },
  { slug: "pricing", title: "Pricing", exportName: "Pricing", frame: "full", load: () => import("@/components/blocks/pricing") },
  { slug: "faq", title: "FAQ", exportName: "Faq", frame: "full", load: () => import("@/components/blocks/faq") },
  { slug: "footer", title: "Footer", exportName: "Footer", frame: "full", load: () => import("@/components/blocks/footer") },
  { slug: "dashboard-shell", title: "Dashboard shell", exportName: "DashboardShell", frame: "app", load: () => import("@/components/blocks/dashboard-shell") },
]
