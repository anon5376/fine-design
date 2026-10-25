import { Hero } from "@/components/blocks/hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function CopyActionsAndMedia() {
  return (
    <Hero
      title="Close the month in a day"
      description="Every payment matched to its invoice as it lands, so the books are ready when the month ends."
      actions={
        <Button size="lg" render={<a href="#" />}>
          Book a demo
        </Button>
      }
      media={
        <Card className="w-full max-w-xs">
          <CardContent>
            <Progress label="March close" value={92} />
          </CardContent>
        </Card>
      }
    />
  )
}
