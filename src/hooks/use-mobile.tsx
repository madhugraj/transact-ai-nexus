import * as React from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const onChange = () => {
      setMatches(mediaQuery.matches)
    }
    
    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener("change", onChange)
    
    return () => {
      mediaQuery.removeEventListener("change", onChange)
    }
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)")
}
