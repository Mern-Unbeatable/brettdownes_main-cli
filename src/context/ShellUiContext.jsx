import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ShellUiContext = createContext(null)

export function ShellUiProvider({ children }) {
  const [overlays, setOverlays] = useState(() => new Set())

  const setOverlay = useCallback((id, open) => {
    setOverlays((prev) => {
      // Bail out when nothing changes so consumers don't re-render in a loop
      if (open ? prev.has(id) : !prev.has(id)) return prev
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      setOverlay,
      overlayOpen: overlays.size > 0,
    }),
    [setOverlay, overlays],
  )

  return <ShellUiContext.Provider value={value}>{children}</ShellUiContext.Provider>
}

export function useShellUi() {
  return useContext(ShellUiContext)
}

/** Register a top-layer panel (cart, menu, account menu, etc.) while it is open. */
export function useShellOverlay(id, open) {
  // Depend on the stable setter only; the context value changes whenever an overlay toggles
  const setOverlay = useShellUi()?.setOverlay

  useEffect(() => {
    if (!setOverlay) return undefined
    setOverlay(id, open)
    return () => setOverlay(id, false)
  }, [setOverlay, id, open])
}
