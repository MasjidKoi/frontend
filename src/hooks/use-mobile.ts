import * as React from "react"
import { DESKTOP_LG_PX } from "@/lib/breakpoints"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DESKTOP_LG_PX - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < DESKTOP_LG_PX)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < DESKTOP_LG_PX)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
