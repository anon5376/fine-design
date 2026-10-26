// The five faces of the Avatar macro. public/avatars holds two (ada, lin); the other three are generated with the same silhouette
// so the row is not a repeat. All are decoded at module load: a frame that shows the fade must not wait on the image.
const face = (bg: string, fg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><circle cx="32" cy="26" r="11" fill="${fg}"/><path d="M12 64c2-14 10-20 20-20s18 6 20 20z" fill="${fg}"/></svg>`)}`

export const FACES = [
  { initials: "AL", name: "Ada Lovelace", src: "/avatars/ada.svg" },
  { initials: "MK", name: "Maya Kapoor", src: face("#d8338a", "#6e0b43") },
  { initials: "LC", name: "Lin Chen", src: "/avatars/lin.svg" },
  { initials: "OP", name: "Omar Pillay", src: face("#2c2a38", "#cfcce0") },
  { initials: "JS", name: "Jonas Svensson", src: face("#e7e5f0", "#8b88a0") },
] as const

const held: HTMLImageElement[] = []
export const facesDecoded: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : Promise.all(
        FACES.map(f => {
          const img = new Image()
          img.src = f.src
          held.push(img)
          return img.decode().catch(() => {})
        }),
      ).then(() => {})
