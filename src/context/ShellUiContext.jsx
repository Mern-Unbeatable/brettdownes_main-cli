import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ShellUiContext = createContext(null)

export function ShellUiProvider({ children }) {
  const [overlays, setOverlays] = useState(() => new Set())

  const setOverlay = useCallback((id, open) => {
    setOverlays((prev) => {
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
  const ctx = useShellUi()

  useEffect(() => {
    if (!ctx?.setOverlay) return undefined
    ctx.setOverlay(id, open)
    return () => ctx.setOverlay(id, false)
  }, [ctx, id, open])
}
