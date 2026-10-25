import { Heading } from "@/components/ui/heading"
import { Container, Grid, Stack } from "@/components/ui/layout"
import { Separator } from "@/components/ui/separator"
import { Text } from "@/components/ui/text"

const groups = [
  { title: "Product", links: ["Transfers", "Invoices", "Wallets", "Pricing"] },
  { title: "Developers", links: ["Documentation", "API reference", "Status"] },
  { title: "Company", links: ["About", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security"] },
]

type FooterProps = {
  /** Year in the legal line. Defaults to the current year. */
  year?: number
}

function Footer({ year = new Date().getFullYear() }: FooterProps) {
  return (
    <footer className="border-t border-border bg-background text-foreground">
      <Container className="py-12 md:py-16">
        <Stack gap="2xl">
          <Grid gap="xl" className="lg:grid-cols-6">
            <a href="#" className="inline-flex h-5 w-fit items-center rounded-control text-base font-semibold tracking-tight outline-none focus-visible:focus-ring lg:col-span-2">
              fine
            </a>
            <nav aria-label="Footer" className="lg:col-span-4">
              <Grid gap="xl" className="grid-cols-2 md:grid-cols-4">
                {groups.map(group => (
                  <Stack key={group.title} gap="xs" render={<section aria-labelledby={`footer-${group.title}`} />}>
                    <Heading id={`footer-${group.title}`} level={2} size="sm" className="text-sm">
                      {group.title}
                    </Heading>
                    <ul>
                      {group.links.map(link => (
                        <li key={link}>
                          <a
                            href="#"
                            className="inline-flex h-8 items-center rounded-control text-sm text-muted-foreground outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:focus-ring"
                          >
                            {link}
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
            © <span className="figures">{year}</span> Fine Payments, Inc.
          </Text>
        </Stack>
      </Container>
    </footer>
  )
}

export { Footer }
