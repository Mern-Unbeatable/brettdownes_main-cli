import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const SettingsContext = createContext(null)

const FALLBACK = {
  deliveryNote: '',
  pickupNote: '',
  paymentDescriptorNote: '',
  statementDescriptor: 'That 3D Printer Guy',
  pickupAddress: { id: 'default', name: 'Peptide Ops Logistics', lines: [] },
  pickupLocations: [{ id: 'default', name: 'Peptide Ops Logistics', lines: [] }],
  freeShippingThresholdCents: 0,
  stripePublishableKey: '',
  stripeEnabled: false,
  shippingEnabled: false,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get('/api/settings/public')
      .then((data) => {
        if (!active || !data?.settings) return
        const next = { ...FALLBACK, ...data.settings }
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
        setSettings(next)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ settings, ready }), [settings, ready])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  return ctx?.settings ?? FALLBACK
}

export function useSettingsReady() {
  const ctx = useContext(SettingsContext)
  return ctx?.ready ?? false
}
