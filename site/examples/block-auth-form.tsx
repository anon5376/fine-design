import { AuthForm } from "@/components/blocks/auth-form"
import { Text } from "@/components/ui/text"

export function TitleLabelAndFooter() {
  return (
    <AuthForm
      title="Create your account"
      submitLabel="Create account"
      footer={
        <Text size="sm" variant="muted">
          Already registered?{" "}
          <a href="#" className="rounded-control text-foreground underline underline-offset-4 outline-none focus-visible:focus-ring">
            Sign in
          </a>
        </Text>
      }
    />
  )
}
