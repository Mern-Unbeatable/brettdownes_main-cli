import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const SettingsContext = createContext(null)

const FALLBACK = {
  deliveryNote: '',
  pickupNote: '',
  paymentDescriptorNote: '',
  statementDescriptor: 'That 3D Printer Guy',
  pickupAddress: { id: 'default', name: 'Peptide Ops Logistics', lines: [] },
  pickupLocations: [{ id: 'default', name: 'Peptide Ops Logistics', lines: [] }],
  freeShippingThresholdCents: 25_000,
  stripePublishableKey: '',
  stripeEnabled: false,
  shippingEnabled: false,
}

function normalize(raw) {
  const next = { ...FALLBACK, ...raw }
  if (!Array.isArray(next.pickupLocations) || !next.pickupLocations.length) {
    next.pickupLocations = next.pickupAddress?.name
      ? [
          {
            id: next.pickupAddress.id || 'default',
            name: next.pickupAddress.name,
            lines: next.pickupAddress.lines || [],
          },
        ]
      : FALLBACK.pickupLocations
  }
  return next
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK)
  const [ready, setReady] = useState(false)
  const { user } = useAuth()
  const userId = user?.id ?? null
  const requestSeq = useRef(0)

  /** Re-fetch public settings; only the latest request is allowed to win. */
  const reload = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      const data = await api.get('/api/settings/public')
      if (seq === requestSeq.current && data?.settings) setSettings(normalize(data.settings))
    } catch {
      // keep the last known settings
    } finally {
      if (seq === requestSeq.current) setReady(true)
    }
  }, [])

  // Initial load (with a couple of retries), and again whenever the signed-in user changes
  useEffect(() => {
    let active = true
    let retryTimer

    const load = (attempt = 0) => {
      const seq = ++requestSeq.current
      api
        .get('/api/settings/public')
        .then((data) => {
          if (!active || seq !== requestSeq.current || !data?.settings) return
          setSettings(normalize(data.settings))
        })
        .catch(() => {
          if (!active || attempt >= 2) return
          retryTimer = window.setTimeout(() => load(attempt + 1), 2000 * (attempt + 1))
        })
        .finally(() => {
          if (active && seq === requestSeq.current) setReady(true)
        })
    }

    load()
    return () => {
      active = false
      window.clearTimeout(retryTimer)
    }
  }, [userId])

  // Pick up admin changes made in another tab when the shopper comes back
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const value = useMemo(() => ({ settings, ready, reload }), [settings, ready, reload])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  return ctx?.settings ?? FALLBACK
}

/** Call after saving settings so storefront UI (promo bar, cart, checkout) updates live. */
export function useReloadSettings() {
  const ctx = useContext(SettingsContext)
  return ctx?.reload ?? (async () => {})
}

export function useSettingsReady() {
  const ctx = useContext(SettingsContext)
  return ctx?.ready ?? false
}
