import { useId, type ReactNode } from "react"
import { Heading } from "@/components/ui/heading"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Separator } from "@/components/ui/separator"
import { Text } from "@/components/ui/text"

type FooterLink = { label: string; href?: string }
type FooterGroup = { title: string; links: FooterLink[] }

const links = (...labels: string[]): FooterLink[] => labels.map(label => ({ label }))

const groups: FooterGroup[] = [
  { title: "Product", links: links("Transfers", "Invoices", "Wallets", "Pricing") },
  { title: "Developers", links: links("Documentation", "API reference", "Status") },
  { title: "Company", links: links("About", "Careers", "Contact") },
  { title: "Legal", links: links("Privacy", "Terms", "Security") },
]

type FooterProps = {
  /** Wordmark or logo, linked to the home page. */
  brand?: ReactNode
  /** Link columns; the grid holds four across at md. */
  groups?: FooterGroup[]
  /** Legal line. Defaults to the copyright notice with `year`. */
  legal?: ReactNode
  /** Year in the default legal line. Defaults to the current year. */
  year?: number
}

function Footer({
  brand = "fine",
  groups: columns = groups,
  year = new Date().getFullYear(),
  legal = (
    <>
      © <span className="figures">{year}</span> Fine Payments, Inc.
    </>
  ),
}: FooterProps) {
  const id = useId()
  return (
    <footer className="border-t-line border-border bg-background text-foreground">
      <Container className="py-12 md:py-16">
        <Stack gap="2xl">
          <Grid gap="xl" className="lg:grid-cols-6">
            <a href="#" className="inline-flex h-5 w-fit items-center rounded-control text-base font-strong tracking-tight outline-none focus-visible:focus-ring lg:col-span-2">
              {brand}
            </a>
            <nav aria-label="Footer" className="lg:col-span-4">
              <Grid gap="xl" className="grid-cols-2 md:grid-cols-4">
                {columns.map((group, i) => (
                  <Stack key={group.title} gap="xs" render={<section aria-labelledby={`${id}-${i}`} />}>
                    <Heading id={`${id}-${i}`} level={2} size="sm" className="text-sm">
                      {group.title}
                    </Heading>
                    <ul>
                      {group.links.map(link => (
                        <li key={link.label}>
                          <a
                            href={link.href ?? "#"}
                            className="inline-flex h-8 items-center rounded-control text-sm text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:focus-ring"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Stack>
                ))}
              </Grid>
            </nav>
          </Grid>
          <Separator />
          <Text size="xs" variant="muted">
            {legal}
          </Text>
        </Stack>
      </Container>
    </footer>
  )
}

export { Footer }
export type { FooterGroup, FooterLink, FooterProps }
