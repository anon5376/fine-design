import { useId, type CSSProperties, type ReactNode } from "react"

/**
 * Directional blur for whip pans: wraps children in an SVG gaussian blur that smears along x and/or y only
 * (CSS filter: blur is isotropic). `x`/`y` are the standard deviation in px; both 0 renders children untouched.
 * Frames are rendered crisp (60fps, no temporal mixing), so this is the only motion blur: use it for hard whips (x ~ 30-80px).
 */
export function DirectionalBlur({ x = 0, y = 0, className, style, children }: { x?: number; y?: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  const id = "blur" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const on = x > 0.05 || y > 0.05
  return (
    <>
      {on && (
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${x} ${y}`} />
          </filter>
        </svg>
      )}
      <div className={className} style={{ ...style, filter: on ? `url(#${id})` : undefined }}>
        {children}
      </div>
    </>
  )
}
