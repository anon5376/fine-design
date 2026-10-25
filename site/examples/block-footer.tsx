import { Footer } from "@/components/blocks/footer"

export function BrandLinksAndLegalLine() {
  return (
    <Footer
      brand="Acme"
      legal="Acme Studio Ltd. Registered in England, no. 04821937."
      groups={[
        {
          title: "Studio",
          links: [
            { label: "Work", href: "/work" },
            { label: "Journal", href: "/journal" },
          ],
        },
        {
          title: "Contact",
          links: [
            { label: "Email", href: "mailto:hello@acme.example" },
            { label: "Press", href: "/press" },
          ],
        },
      ]}
    />
  )
}
