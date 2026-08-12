import { useEffect, useState } from 'react'
import { CreditCard, Mail, Plus, Save, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import {
  Button,
  Card,
  ErrorBlock,
  Field,
  Input,
  LoadingBlock,
  PageHeading,
  Reveal,
  Textarea,
  Toggle,
} from '../ui'

function newLocation() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    lines: [],
  }
}

export default function AdminSettings() {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/settings')
      .then((data) => {
        const next = data.settings
        if (!Array.isArray(next.pickupLocations) || next.pickupLocations.length === 0) {
          next.pickupLocations = [
            {
              id: next.pickupAddress?.id || 'default',
              name: next.pickupAddress?.name || '',
              lines: next.pickupAddress?.lines || [],
            },
          ]
        }
        setSettings(next)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const updateLocation = (id, patch) => {
    setSettings((prev) => ({
      ...prev,
      pickupLocations: prev.pickupLocations.map((loc) =>
        loc.id === id ? { ...loc, ...patch } : loc,
      ),
    }))
  }

  const addLocation = () => {
    setSettings((prev) => ({
      ...prev,
      pickupLocations: [...prev.pickupLocations, newLocation()],
    }))
  }

  const removeLocation = (id) => {
    setSettings((prev) => {
      if (prev.pickupLocations.length <= 1) {
        toast.error('Keep at least one pickup location.')
        return prev
      }
      return {
        ...prev,
        pickupLocations: prev.pickupLocations.filter((loc) => loc.id !== id),
      }
    })
  }

  const addEmail = () => {
    const value = emailDraft.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error('Enter a valid email address.')
      return
    }
    if (settings.adminNotifyEmails.includes(value)) {
      setEmailDraft('')
      return
    }
    set('adminNotifyEmails', [...settings.adminNotifyEmails, value])
    setEmailDraft('')
  }

  const save = async (event) => {
    event.preventDefault()

    const locations = (settings.pickupLocations || [])
      .map((loc) => ({
        id: loc.id,
        name: String(loc.name || '').trim(),
        lines: Array.isArray(loc.lines)
          ? loc.lines.map((line) => String(line || '').trim()).filter(Boolean)
          : [],
      }))
      .filter((loc) => loc.name)

    if (!locations.length) {
      toast.error('Add at least one pickup location with a name.')
      return
    }

    setSaving(true)
    try {
      const data = await api.patch('/api/settings', {
        autoApproval: settings.autoApproval,
        adminNotifyEmails: settings.adminNotifyEmails,
        notifyNewRegistration: settings.notifyNewRegistration,
        notifyNewOrder: settings.notifyNewOrder,
        deliveryNote: settings.deliveryNote,
        pickupNote: settings.pickupNote,
        paymentDescriptorNote: settings.paymentDescriptorNote,
        statementDescriptor: settings.statementDescriptor,
        shipFrom: settings.shipFrom,
        pickupLocations: locations,
        pickupAddress: locations[0],
        defaultParcel: settings.defaultParcel,
        handlingFeeCents: Number(settings.handlingFeeCents) || 0,
        freeShippingThresholdCents: Number(settings.freeShippingThresholdCents) || 0,
      })
      setSettings(data.settings)
      toast.success('Settings saved.', { title: 'Saved' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingBlock label="Loading settings" />
  if (error) return <ErrorBlock message={error} onRetry={load} />
  if (!settings) return null

  return (
    <form onSubmit={save}>
      <PageHeading
        title="Settings"
        subtitle="Approvals, notifications, checkout copy and pickup locations."
        actions={
          <Button type="submit" variant="primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        }
      />

      <Reveal className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Registrations</h2>
          <div className="space-y-3">
            <Toggle
              checked={settings.autoApproval}
              onChange={(value) => set('autoApproval', value)}
              label="Auto-approve new registrations"
              description="When off, new researchers stay pending until you approve them and cannot sign in."
            />
            <Toggle
              checked={settings.notifyNewRegistration}
              onChange={(value) => set('notifyNewRegistration', value)}
              label="Email me about new registrations"
            />
            <Toggle
              checked={settings.notifyNewOrder}
              onChange={(value) => set('notifyNewOrder', value)}
              label="Email me about new orders"
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <Mail className="h-4 w-4 text-cyan-dim" />
            Notification recipients
          </h2>

          <div className="flex gap-2">
            <Input
              type="email"
              value={emailDraft}
              onChange={(event) => setEmailDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addEmail()
                }
              }}
              placeholder="ops@peptideopslogistics.com"
            />
            <Button variant="ghost" onClick={addEmail}>
              Add
            </Button>
          </div>

          <ul className="mt-3 space-y-2">
            {settings.adminNotifyEmails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2 rounded-xl bg-fog px-3.5 py-2.5"
              >
                <span className="min-w-0 truncate text-[12px] text-ink">{email}</span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      'adminNotifyEmails',
                      settings.adminNotifyEmails.filter((entry) => entry !== email),
                    )
                  }
                  className="shrink-0 text-[11px] font-semibold text-muted transition hover:text-rose-600"
                >
                  Remove
                </button>
              </li>
            ))}
            {settings.adminNotifyEmails.length === 0 ? (
              <li className="text-[12px] text-muted">
                No recipients set — notifications fall back to all admin accounts.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Checkout copy</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Delivery note"
              hint="Shown on the checkout page for delivery orders."
              className="lg:col-span-2"
            >
              <Textarea
                rows={3}
                value={settings.deliveryNote}
                onChange={(event) => set('deliveryNote', event.target.value)}
              />
            </Field>
            <Field label="Pickup note" hint="Shown when warehouse pickup is selected.">
              <Textarea
                rows={3}
                value={settings.pickupNote}
                onChange={(event) => set('pickupNote', event.target.value)}
              />
            </Field>
            <Field
              label="Statement descriptor note"
              hint="Displayed above the pay button so the charge is never a surprise."
            >
              <Textarea
                rows={3}
                value={settings.paymentDescriptorNote}
                onChange={(event) => set('paymentDescriptorNote', event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <CreditCard className="h-4 w-4 text-cyan-dim" />
            Payments
          </h2>

          <Field
            label="Card statement descriptor"
            hint="Max 22 characters. Stripe only ever receives the amount, this descriptor and the internal order id — never product names."
          >
            <Input
              maxLength={22}
              value={settings.statementDescriptor}
              onChange={(event) => set('statementDescriptor', event.target.value)}
            />
          </Field>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[15px] font-bold text-ink">Pickup locations</h2>
              <p className="mt-1 text-[12px] text-muted">
                Customers choose one of these at checkout for warehouse pickup.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLocation}>
              <Plus className="h-3.5 w-3.5" />
              Add location
            </Button>
          </div>

          <div className="space-y-4">
            {settings.pickupLocations.map((location, index) => (
              <div
                key={location.id}
                className="rounded-2xl border border-black/6 bg-fog/40 p-4 md:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                    Location {index + 1}
                  </p>
                  {settings.pickupLocations.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-muted transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Location name">
                    <Input
                      value={location.name || ''}
                      onChange={(event) =>
                        updateLocation(location.id, { name: event.target.value })
                      }
                      placeholder="Warehouse name or city"
                    />
                  </Field>
                  <Field label="Address lines" hint="One line per row.">
                    <Textarea
                      rows={3}
                      value={(location.lines || []).join('\n')}
                      onChange={(event) =>
                        updateLocation(location.id, {
                          lines: event.target.value.split('\n'),
                        })
                      }
                      placeholder={'4472 River Rd N\nKeizer, OR 97303'}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="primary" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
