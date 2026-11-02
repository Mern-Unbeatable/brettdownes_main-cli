import { useCallback, useEffect, useRef, useState } from 'react'
import { Truck } from 'lucide-react'
import { api } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import { useReloadSettings } from '../../../context/SettingsContext'
import { Button, Field, Input, LoadingBlock, Modal, Toggle } from '../ui'

const DEFAULT_DOLLARS = 250

export function FreeDeliveryControls({
  enabled,
  amountDollars,
  onEnabledChange,
  onAmountChange,
  onAmountBlur,
  disabled = false,
  saving = false,
}) {
  return (
    <div className="grid gap-4">
      <Toggle
        checked={enabled}
        onChange={onEnabledChange}
        disabled={disabled || saving}
        label="Free delivery"
        description="When on, delivery orders at or above the minimum subtotal (before discounts) ship free at checkout."
      />
      {enabled ? (
        <Field
          label="Minimum subtotal (USD)"
          hint="Cart merchandise subtotal before bulk discounts and coupons. Tap outside the field or press Enter to save."
        >
          <Input
            type="number"
            min={1}
            step={1}
            disabled={disabled || saving}
            value={amountDollars}
            onChange={(event) =>
              onAmountChange(Math.max(1, Number(event.target.value || DEFAULT_DOLLARS)))
            }
            onBlur={() => onAmountBlur?.()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
        </Field>
      ) : (
        <p className="rounded-xl bg-fog px-4 py-3 text-[12px] leading-relaxed text-muted">
          Free delivery is off. Customers always pay live carrier rates at checkout.
        </p>
      )}
      {saving ? (
        <p className="text-center text-[11px] font-medium text-cyan-dim">Saving…</p>
      ) : (
        <p className="text-center text-[11px] text-muted">Changes save automatically.</p>
      )}
    </div>
  )
}

function useFreeDeliverySettings({ toast, reloadKey = 0 }) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [amountDollars, setAmountDollars] = useState(DEFAULT_DOLLARS)
  const rememberedDollars = useRef(DEFAULT_DOLLARS)

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get('/api/settings')
      .then((data) => {
        if (!active) return
        const cents = Number(data.settings?.freeShippingThresholdCents) || 0
        const on = cents > 0
        const dollars = on ? cents / 100 : rememberedDollars.current
        if (on) rememberedDollars.current = dollars
        setEnabled(on)
        setAmountDollars(dollars)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [toast, reloadKey])

  return {
    loading,
    enabled,
    setEnabled,
    amountDollars,
    setAmountDollars,
    rememberedDollars,
  }
}

/** Compact control for the Orders page header — opens a modal. */
export function FreeDeliveryOrdersButton() {
  const toast = useToast()
  const reloadSettings = useReloadSettings()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const lastSavedCents = useRef(-1)
  const { loading, enabled, setEnabled, amountDollars, setAmountDollars, rememberedDollars } =
    useFreeDeliverySettings({ toast })

  const persist = useCallback(
    async (nextEnabled, nextDollars) => {
      const freeShippingThresholdCents = nextEnabled
        ? Math.round(Math.max(1, nextDollars) * 100)
        : 0
      if (freeShippingThresholdCents === lastSavedCents.current) return

      setSaving(true)
      try {
        await api.patch('/api/settings', { freeShippingThresholdCents })
        lastSavedCents.current = freeShippingThresholdCents
        reloadSettings()
        toast.success(
          nextEnabled
            ? `Free delivery on orders $${Math.round(nextDollars)}+ (before discounts).`
            : 'Free delivery turned off.',
          { title: 'Shipping updated' },
        )
      } catch (err) {
        toast.error(err.message)
      } finally {
        setSaving(false)
      }
    },
    [toast, reloadSettings],
  )

  useEffect(() => {
    if (loading) return
    const cents = enabled ? Math.round(Math.max(1, amountDollars) * 100) : 0
    lastSavedCents.current = cents
  }, [loading, enabled, amountDollars])

  const handleToggle = async (on) => {
    let nextDollars = amountDollars
    if (!on) {
      rememberedDollars.current = amountDollars
      setEnabled(false)
    } else {
      nextDollars = rememberedDollars.current || DEFAULT_DOLLARS
      setAmountDollars(nextDollars)
      setEnabled(true)
    }
    await persist(on, nextDollars)
  }

  const handleAmountBlur = async () => {
    if (!enabled || saving) return
    await persist(true, amountDollars)
  }

  return (
    <>
      <Button
        type="button"
        variant={enabled ? 'primary' : 'dark'}
        size="sm"
        onClick={() => setOpen(true)}
        className="shadow-sm"
      >
        <Truck className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span>Free delivery</span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
            enabled ? 'bg-navy/15 text-navy' : 'bg-white/15 text-white'
          }`}
        >
          {enabled ? `$${Math.round(amountDollars)}+` : 'Off'}
        </span>
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!saving) setOpen(false)
        }}
        title="Free delivery"
        size="sm"
      >
        {loading ? (
          <LoadingBlock label="Loading shipping rules" />
        ) : (
          <FreeDeliveryControls
            enabled={enabled}
            amountDollars={amountDollars}
            onEnabledChange={handleToggle}
            onAmountChange={setAmountDollars}
            onAmountBlur={handleAmountBlur}
            saving={saving}
          />
        )}
      </Modal>
    </>
  )
}
