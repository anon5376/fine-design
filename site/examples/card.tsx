import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function Default() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Invoice 2041</CardTitle>
        <span className="figures text-sm">$4,280.00</span>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Due 12 November · Northwind Traders</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">View</Button>
        <Button>Pay invoice</Button>
      </CardFooter>
    </Card>
  )
}
