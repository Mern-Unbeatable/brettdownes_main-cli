import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgePercent, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { api, formatCents } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeading,
  Select,
  Toggle,
} from '../ui'

const EMPTY_COUPON = {
  code: '',
  description: '',
  enabled: true,
  discountType: 'PERCENT',
  discountValue: 10,
  appliesTo: 'ALL',
  productIds: [],
  minSubtotalCents: 0,
  usageLimit: null,
  startsAt: null,
  expiresAt: null,
}

function dateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export default function AdminDiscounts() {
  const toast = useToast()
  const [tab, setTab] = useState('discounts')
  const [tiers, setTiers] = useState([])
  const [coupons, setCoupons] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [couponDraft, setCouponDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/api/discounts/admin'),
      api.get('/api/products?includeInactive=true'),
    ])
      .then(([discountData, productData]) => {
        setTiers(discountData.tiers || [])
        setCoupons(discountData.coupons || [])
        setProducts(productData.products || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const saveTier = async (tier) => {
    setSaving(true)
    try {
      const payload = {
        name: tier.detail,
        enabled: tier.enabled,
        scope: tier.scope,
        percent: Number(tier.percent),
        minSubtotalCents: Number(tier.minSubtotalCents),
      }
      const data = tier.isNew
        ? await api.post('/api/discounts/admin/tiers', payload)
        : await api.patch(`/api/discounts/admin/tiers/${tier.id}`, payload)
      setTiers((current) =>
        current.map((entry) => (entry.id === tier.id ? data.tier : entry)),
      )
      toast.success('Automatic discount saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteTier = async (tier) => {
    if (tier.isNew) {
      setTiers((current) => current.filter((entry) => entry.id !== tier.id))
      return
    }
    try {
      await api.delete(`/api/discounts/admin/tiers/${tier.id}`)
      setTiers((current) => current.filter((entry) => entry.id !== tier.id))
      toast.success('Automatic discount removed.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveCoupon = async () => {
    const draft = couponDraft
    if (!draft) return
    setSaving(true)
    try {
      const payload = {
        ...draft,
        code: draft.code.trim().toUpperCase(),
        discountValue: Number(draft.discountValue),
        minSubtotalCents: Number(draft.minSubtotalCents),
        usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null,
        startsAt: draft.startsAt || null,
        expiresAt: draft.expiresAt ? `${draft.expiresAt}T23:59:59.999Z` : null,
      }
      delete payload.id
      delete payload.createdAt
      delete payload.updatedAt
      delete payload.usageCount
      const data = draft.id
        ? await api.patch(`/api/discounts/admin/coupons/${draft.id}`, payload)
        : await api.post('/api/discounts/admin/coupons', payload)
      setCoupons((current) =>
        draft.id
          ? current.map((entry) => (entry.id === draft.id ? data.coupon : entry))
          : [data.coupon, ...current],
      )
      setCouponDraft(null)
      toast.success('Coupon saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteCoupon = async (coupon) => {
    try {
      await api.delete(`/api/discounts/admin/coupons/${coupon.id}`)
      setCoupons((current) => current.filter((entry) => entry.id !== coupon.id))
      toast.success('Coupon removed.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const selectedProductNames = useMemo(() => {
    if (!couponDraft) return []
    const ids = new Set(couponDraft.productIds)
    return products.filter((product) => ids.has(product.id)).map((product) => product.name)
  }, [couponDraft, products])

  if (loading) return <LoadingBlock label="Loading discounts" />
  if (error) return <ErrorBlock message={error} onRetry={load} />

  return (
    <>
      <PageHeading
        title="Discounts & coupons"
        subtitle="Manage automatic bulk rewards and checkout coupon codes."
        actions={
          tab === 'coupons' ? (
            <Button onClick={() => setCouponDraft({ ...EMPTY_COUPON })}>
              <Plus className="h-4 w-4" /> New coupon
            </Button>
          ) : (
            <Button
              onClick={() =>
                setTiers((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}`,
                    isNew: true,
                    enabled: true,
                    scope: 'ORDER',
                    percent: 10,
                    minSubtotalCents: 0,
                    detail: 'New automatic discount',
                  },
                ])
              }
            >
              <Plus className="h-4 w-4" /> New discount
            </Button>
          )
        }
      />

      <div className="mb-5 flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
        {[
          ['discounts', 'Automatic discounts', BadgePercent],
          ['coupons', 'Coupons', Tag],
        ].map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition ${
              tab === value ? 'bg-navy text-cyan' : 'text-muted hover:bg-fog hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'discounts' ? (
        <div className="space-y-4">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Field label="Label" className="xl:col-span-2">
                  <Input
                    value={tier.detail}
                    onChange={(event) =>
                      setTiers((current) =>
                        current.map((entry) =>
                          entry.id === tier.id ? { ...entry, detail: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Discount">
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={tier.percent}
                      onChange={(event) =>
                        setTiers((current) =>
                          current.map((entry) =>
                            entry.id === tier.id
                              ? { ...entry, percent: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      className="pr-9"
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">%</span>
                  </div>
                </Field>
                <Field label="Applies to">
                  <Select
                    value={tier.scope}
                    onChange={(event) =>
                      setTiers((current) =>
                        current.map((entry) =>
                          entry.id === tier.id ? { ...entry, scope: event.target.value } : entry,
                        ),
                      )
                    }
                  >
                    <option value="ORDER">Entire order</option>
                    <option value="KIT">Full kit (qty 10+ of one item)</option>
                  </Select>
                </Field>
                <Field label="Minimum order ($)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tier.minSubtotalCents / 100}
                    onChange={(event) =>
                      setTiers((current) =>
                        current.map((entry) =>
                          entry.id === tier.id
                            ? {
                                ...entry,
                                minSubtotalCents: Math.round(Number(event.target.value || 0) * 100),
                              }
                            : entry,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Toggle
                  checked={tier.enabled}
                  onChange={(enabled) =>
                    setTiers((current) =>
                      current.map((entry) => (entry.id === tier.id ? { ...entry, enabled } : entry)),
                    )
                  }
                  label="Enabled"
                />
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => deleteTier(tier)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                  <Button size="sm" disabled={saving} onClick={() => saveTier(tier)}>
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : coupons.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-bold text-ink">{coupon.code}</p>
                    <Badge tone={coupon.enabled ? 'ACTIVE' : 'BLOCKED'}>
                      {coupon.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">
                    {coupon.discountType === 'PERCENT'
                      ? `${coupon.discountValue}% off`
                      : `${formatCents(coupon.discountValue)} off`}
                    {' · '}
                    {coupon.appliesTo === 'ALL'
                      ? 'All products'
                      : `${coupon.productIds.length} selected product${coupon.productIds.length === 1 ? '' : 's'}`}
                  </p>
                  {coupon.description ? (
                    <p className="mt-2 text-[13px] text-ink">{coupon.description}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted">
                    Used {coupon.usageCount}
                    {coupon.usageLimit ? ` of ${coupon.usageLimit}` : ' times'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCouponDraft({ ...coupon })}
                    className="rounded-lg p-2 text-muted hover:bg-fog hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(coupon)}
                    className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No coupons yet"
          message="Create a code customers can apply during checkout."
          action={<Button onClick={() => setCouponDraft({ ...EMPTY_COUPON })}>Create coupon</Button>}
        />
      )}

      <Modal
        open={Boolean(couponDraft)}
        onClose={() => setCouponDraft(null)}
        title={couponDraft?.id ? 'Edit coupon' : 'Create coupon'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCouponDraft(null)}>Cancel</Button>
            <Button disabled={saving} onClick={saveCoupon}>{saving ? 'Saving…' : 'Save coupon'}</Button>
          </>
        }
      >
        {couponDraft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coupon code">
              <Input
                value={couponDraft.code}
                onChange={(event) =>
                  setCouponDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                placeholder="SAVE20"
              />
            </Field>
            <Field label="Description">
              <Input
                value={couponDraft.description}
                onChange={(event) =>
                  setCouponDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Optional internal note"
              />
            </Field>
            <Field label="Discount type">
              <Select
                value={couponDraft.discountType}
                onChange={(event) =>
                  setCouponDraft((current) => ({
                    ...current,
                    discountType: event.target.value,
                    discountValue: 10,
                  }))
                }
              >
                <option value="PERCENT">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </Select>
            </Field>
            <Field label={couponDraft.discountType === 'PERCENT' ? 'Percent off' : 'Amount off ($)'}>
              <Input
                type="number"
                min="1"
                step={couponDraft.discountType === 'PERCENT' ? '1' : '0.01'}
                value={
                  couponDraft.discountType === 'FIXED'
                    ? couponDraft.discountValue / 100
                    : couponDraft.discountValue
                }
                onChange={(event) =>
                  setCouponDraft((current) => ({
                    ...current,
                    discountValue:
                      current.discountType === 'FIXED'
                        ? Math.round(Number(event.target.value || 0) * 100)
                        : Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Applies to">
              <Select
                value={couponDraft.appliesTo}
                onChange={(event) =>
                  setCouponDraft((current) => ({
                    ...current,
                    appliesTo: event.target.value,
                    productIds: event.target.value === 'ALL' ? [] : current.productIds,
                  }))
                }
              >
                <option value="ALL">All products</option>
                <option value="SELECTED">Selected products</option>
              </Select>
            </Field>
            <Field label="Minimum order ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={couponDraft.minSubtotalCents / 100}
                onChange={(event) =>
                  setCouponDraft((current) => ({
                    ...current,
                    minSubtotalCents: Math.round(Number(event.target.value || 0) * 100),
                  }))
                }
              />
            </Field>
            {couponDraft.appliesTo === 'SELECTED' ? (
              <Field
                label="Eligible products"
                hint={selectedProductNames.length ? `${selectedProductNames.length} selected` : 'Select at least one.'}
                className="sm:col-span-2"
              >
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-black/10 p-3 sm:grid-cols-2">
                  {products.map((product) => {
                    const checked = couponDraft.productIds.includes(product.id)
                    return (
                      <label key={product.id} className="flex items-center gap-2 rounded-lg bg-fog px-3 py-2 text-[12px] text-ink">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setCouponDraft((current) => ({
                              ...current,
                              productIds: checked
                                ? current.productIds.filter((id) => id !== product.id)
                                : [...current.productIds, product.id],
                            }))
                          }
                          className="accent-[#00c4ab]"
                        />
                        {product.name}
                      </label>
                    )
                  })}
                </div>
              </Field>
            ) : null}
            <Field label="Usage limit" hint="Leave empty for unlimited.">
              <Input
                type="number"
                min="1"
                value={couponDraft.usageLimit || ''}
                onChange={(event) =>
                  setCouponDraft((current) => ({ ...current, usageLimit: event.target.value || null }))
                }
              />
            </Field>
            <div className="flex items-end">
              <Toggle
                checked={couponDraft.enabled}
                onChange={(enabled) => setCouponDraft((current) => ({ ...current, enabled }))}
                label="Coupon enabled"
              />
            </div>
            <Field label="Start date" hint="Optional.">
              <Input
                type="date"
                value={dateInput(couponDraft.startsAt)}
                onChange={(event) =>
                  setCouponDraft((current) => ({ ...current, startsAt: event.target.value || null }))
                }
              />
            </Field>
            <Field label="End date" hint="Optional.">
              <Input
                type="date"
                value={dateInput(couponDraft.expiresAt)}
                onChange={(event) =>
                  setCouponDraft((current) => ({ ...current, expiresAt: event.target.value || null }))
                }
              />
            </Field>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
