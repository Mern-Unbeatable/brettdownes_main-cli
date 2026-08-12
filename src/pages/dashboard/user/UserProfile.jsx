import { useEffect, useState } from 'react'
import { MapPin, Plus, Save, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeading,
  Reveal,
  Textarea,
  formatDate,
} from '../ui'

const EMPTY_ADDRESS = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  isDefault: false,
}

export default function UserProfile() {
  const { user, setUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    researchFramework: '',
  })
  const [saving, setSaving] = useState(false)

  const [addresses, setAddresses] = useState([])
  const [addressModal, setAddressModal] = useState(null)
  const [addressSaving, setAddressSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      company: user.company || '',
      phone: user.phone || '',
      researchFramework: user.researchFramework || '',
    })
  }, [user])

  const loadAddresses = () => {
    api
      .get('/api/auth/me/addresses')
      .then((data) => setAddresses(data.addresses || []))
      .catch(() => setAddresses([]))
  }

  useEffect(loadAddresses, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Your name cannot be empty.')
      return
    }

    setSaving(true)
    try {
      const data = await api.patch('/api/auth/me', form)
      setUser(data.user)
      toast.success('Profile updated.', { title: 'Saved' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveAddress = async () => {
    const payload = { ...addressModal }
    delete payload.id

    if (!payload.line1?.trim() || !payload.city?.trim() || !payload.state?.trim() || !payload.zip?.trim()) {
      toast.error('Street, city, state and ZIP are all required.')
      return
    }

    setAddressSaving(true)
    try {
      if (addressModal.id) {
        await api.patch(`/api/auth/me/addresses/${addressModal.id}`, payload)
      } else {
        await api.post('/api/auth/me/addresses', payload)
      }
      toast.success('Address saved.', { title: 'Saved' })
      setAddressModal(null)
      loadAddresses()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAddressSaving(false)
    }
  }

  const deleteAddress = async (id) => {
    try {
      await api.delete(`/api/auth/me/addresses/${id}`)
      toast.success('Address removed.')
      loadAddresses()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <PageHeading title="Profile" subtitle="Your account details and saved shipping addresses." />

      <Reveal className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input name="name" value={form.name} onChange={onChange} />
              </Field>
              <Field label="Company / institution">
                <Input name="company" value={form.company} onChange={onChange} />
              </Field>
              <Field label="Phone">
                <Input name="phone" value={form.phone} onChange={onChange} />
              </Field>
              <Field label="Email">
                <Input value={user?.email || ''} disabled />
              </Field>
            </div>

            <Field label="Research framework">
              <Textarea
                name="researchFramework"
                value={form.researchFramework}
                onChange={onChange}
                rows={4}
              />
            </Field>

            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Account</h2>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge>{user?.status}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Role</dt>
                <dd>
                  <Badge>{user?.role}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Member since</dt>
                <dd className="font-medium text-ink">{formatDate(user?.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <h2 className="font-display text-[15px] font-bold text-ink">Saved addresses</h2>
              <Button size="sm" variant="ghost" onClick={() => setAddressModal({ ...EMPTY_ADDRESS })}>
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={MapPin}
                  title="No saved addresses"
                  message="Save an address to speed up future checkouts."
                />
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {addresses.map((address) => (
                  <li key={address.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-[13px]">
                        <p className="flex items-center gap-2 font-semibold text-ink">
                          {address.label || 'Shipping address'}
                          {address.isDefault ? <Badge tone="ACTIVE">Default</Badge> : null}
                        </p>
                        <p className="mt-1 text-muted">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}
                        </p>
                        <p className="text-muted">
                          {address.city}, {address.state} {address.zip}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setAddressModal(address)}
                          className="rounded-lg px-2 py-1 text-[12px] font-semibold text-cyan-dim transition hover:bg-fog"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(address.id)}
                          aria-label="Delete address"
                          className="rounded-lg p-1.5 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Reveal>

      <Modal
        open={Boolean(addressModal)}
        onClose={() => setAddressModal(null)}
        title={addressModal?.id ? 'Edit address' : 'Add address'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddressModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveAddress} disabled={addressSaving}>
              {addressSaving ? 'Saving…' : 'Save address'}
            </Button>
          </>
        }
      >
        {addressModal ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" className="sm:col-span-2">
              <Input
                value={addressModal.label || ''}
                onChange={(e) => setAddressModal({ ...addressModal, label: e.target.value })}
                placeholder="Lab, office, home…"
              />
            </Field>
            <Field label="Street address" className="sm:col-span-2">
              <Input
                value={addressModal.line1 || ''}
                onChange={(e) => setAddressModal({ ...addressModal, line1: e.target.value })}
              />
            </Field>
            <Field label="Apt / suite" className="sm:col-span-2">
              <Input
                value={addressModal.line2 || ''}
                onChange={(e) => setAddressModal({ ...addressModal, line2: e.target.value })}
              />
            </Field>
            <Field label="City">
              <Input
                value={addressModal.city || ''}
                onChange={(e) => setAddressModal({ ...addressModal, city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                value={addressModal.state || ''}
                onChange={(e) => setAddressModal({ ...addressModal, state: e.target.value })}
              />
            </Field>
            <Field label="ZIP">
              <Input
                value={addressModal.zip || ''}
                onChange={(e) => setAddressModal({ ...addressModal, zip: e.target.value })}
              />
            </Field>
            <Field label="Country">
              <Input
                value={addressModal.country || 'US'}
                maxLength={2}
                onChange={(e) =>
                  setAddressModal({ ...addressModal, country: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(addressModal.isDefault)}
                onChange={(e) => setAddressModal({ ...addressModal, isDefault: e.target.checked })}
                className="h-4 w-4 accent-[#00c4ab]"
              />
              <span className="text-[13px] text-ink">Use as my default address</span>
            </label>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
