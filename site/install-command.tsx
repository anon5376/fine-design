import { Code } from "@/site/example"

/** shadcn install line pointing at the registry this build was made for (REGISTRY_URL). */
export function InstallCommand({ name }: { name: string }) {
  return <Code code={`npx shadcn@latest add ${process.env.REGISTRY_URL}/r/${name}.json`} />
}
