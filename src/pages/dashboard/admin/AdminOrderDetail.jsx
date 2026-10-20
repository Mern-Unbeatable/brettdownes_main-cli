import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  Truck,
  User,
  Warehouse,
} from 'lucide-react'
import ShipFields from './ShipFields'
import { api, assetUrl, formatCents } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import { isImageDocument, pdfViewerUrl } from '../../../utils/coaFiles'
import {
  Badge,
  Button,
  Card,
  ErrorBlock,
  Input,
  LoadingBlock,
  Modal,
  Select,
  Spinner,
  formatDate,
} from '../ui'

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

/** Maps /other store API payload to the same shape the main order detail UI expects. */
function normalizeStoreOrder(raw) {
  if (!raw) return raw
  return {
    ...raw,
    fulfillment: 'DELIVERY',
    paymentMethod: 'STRIPE',
    creditCents: raw.creditCents || 0,
    discountLabel: raw.couponCode || raw.discountLabel,
    service: raw.service || raw.shippingLabel,
    address: {
      line1: raw.addressLine1,
      line2: raw.addressLine2,
      city: raw.city,
      state: raw.state,
      zip: raw.zip,
      country: raw.country,
    },
    items: (raw.items || []).map((item) => ({
      ...item,
      dose: [item.strength, item.vialSize].filter(Boolean).join(' · ') || item.dose || '—',
      lineTotalCents: item.lineTotalCents ?? item.unitPriceCents * item.qty,
    })),
    events: raw.events || [],
  }
}

function adaptOrder(raw, isStore) {
  return isStore ? normalizeStoreOrder(raw) : raw
}

function carrierTrackName(order) {
  const token = `${order?.carrier || ''} ${order?.service || ''}`.toLowerCase()
  const code = String(order?.trackingCode || '').trim()
  if (token.includes('usps') || token.includes('postal') || /^(94|93|92|91)\d{18,}$/.test(code)) {
    return 'USPS'
  }
  if (/^1Z/i.test(code) || token.includes('ups')) return 'UPS'
  if (token.includes('fedex')) return 'FedEx'
  return 'carrier'
}

function carrierTrackUrl(order) {
  const code = String(order?.trackingCode || '').trim()
  if (!code) return null
  const encoded = encodeURIComponent(code)
  const name = carrierTrackName(order)
  if (name === 'USPS') return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`
  if (name === 'UPS') return `https://www.ups.com/track?loc=en_US&tracknum=${encoded}`
  if (name === 'FedEx') return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`
  return order?.trackingUrl || null
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  const isStore = location.pathname.includes('/admin/store-orders')
  const apiBase = isStore ? '/api/wholesale/admin/orders' : '/api/admin/orders'
  const listPath = isStore ? '/admin/store-orders' : '/admin/orders'

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [trackingCode, setTrackingCode] = useState('')
  const [labelPreview, setLabelPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer

    setOrder(null)
    setLoading(true)
    setShowLoader(false)
    setError(null)

    // Only show spinner if still pending after a short delay — avoids flash on fast loads.
    timer = window.setTimeout(() => {
      if (!cancelled) setShowLoader(true)
    }, 180)

    api
      .get(`${apiBase}/${id}`)
      .then((data) => {
        if (!cancelled) setOrder(adaptOrder(data.order, isStore))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) {
          window.clearTimeout(timer)
          setLoading(false)
          setShowLoader(false)
        }
      })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [id, apiBase, isStore])

  useEffect(() => {
    if (!order?.trackingCode) return undefined
    if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return undefined
    const pull = () => {
      api
        .get(`${apiBase}/${id}`)
        .then((data) => setOrder(adaptOrder(data.order, isStore)))
        .catch(() => {})
    }
    const first = window.setTimeout(pull, 15000)
    const timer = window.setInterval(pull, 60000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [id, apiBase, isStore, order?.trackingCode, order?.status])

  const load = () => {
    setLoading(true)
    setShowLoader(true)
    setError(null)
    api
      .get(`${apiBase}/${id}`)
      .then((data) => setOrder(adaptOrder(data.order, isStore)))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false)
        setShowLoader(false)
      })
  }

  const changeStatus = async (status) => {
    setBusy(true)
    try {
      const body = isStore ? { status } : { status, notifyCustomer: true }
      const data = await api.patch(`${apiBase}/${id}/status`, body)
      setOrder(adaptOrder(data.order, isStore))
      toast.success(`Order marked as ${status.toLowerCase()}.`, { title: 'Updated' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const changePayment = async (paymentStatus) => {
    setBusy(true)
    try {
      const data = await api.patch(`${apiBase}/${id}/payment`, { paymentStatus })
      setOrder(adaptOrder(data.order, isStore))
      toast.success(`Payment marked as ${paymentStatus.toLowerCase()}.`, { title: 'Updated' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const syncStripePayment = async () => {
    if (isStore) return
    setBusy(true)
    try {
      const data = await api.post(`${apiBase}/${id}/payment/sync`)
      setOrder(adaptOrder(data.order, isStore))
      toast.success('Stripe confirmed the charge. Order marked paid.', { title: 'Paid' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !order) {
    return showLoader ? (
      <LoadingBlock label="Loading order" />
    ) : (
      <div className="min-h-[220px]" aria-hidden />
    )
  }
  if (error && !order) return <ErrorBlock message={error} onRetry={load} />
  if (!order) return null

  const isPickup = order.fulfillment === 'PICKUP'
  const isManualPayment = order.paymentMethod === 'PICKUP'
  const autoFulfillment = !isPickup && !isManualPayment
  const trackUrl = carrierTrackUrl(order)

  const saveTracking = async (event) => {
    event.preventDefault()
    const code = trackingCode.trim()
    if (!code) return
    setBusy(true)
    try {
      const data = await api.post(`${apiBase}/${id}/tracking`, { trackingCode: code })
      setOrder(adaptOrder(data.order, isStore))
      setTrackingCode('')
      toast.success('Tracking saved. The customer was emailed.', { title: 'Shipped' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteOrder = async () => {
    setBusy(true)
    try {
      await api.delete(`${apiBase}/${id}`)
      toast.success(`${order.orderNumber} was deleted.`, { title: 'Deleted' })
      navigate(listPath)
    } catch (err) {
      toast.error(err.message)
      setBusy(false)
    }
  }

  const downloadLabel = async () => {
    setBusy(true)
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const response = await fetch(`${base}/api/admin/orders/${id}/label/download`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not download the shipping label.')
      }
      const blob = await response.blob()
      const headerName = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]
      const type = blob.type || response.headers.get('content-type') || ''
      const extension = headerName?.split('.').pop() || (type.includes('pdf') ? 'pdf' : type.includes('jpeg') ? 'jpg' : 'png')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = headerName || `shipping-label-${order.orderNumber}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(listPath)}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {isStore ? 'Back to other orders' : 'Back to orders'}
      </button>

      <div className="relative mb-5 overflow-hidden rounded-3xl bg-navy text-white shadow-sm">
        {busy && !confirmDelete ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-navy/40 backdrop-blur-[1px]">
            <Spinner className="h-6 w-6 border-white/20 border-t-cyan" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 md:px-6 md:py-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] text-cyan uppercase">
              {isPickup ? 'Warehouse pickup' : isStore ? 'Other store order' : 'Delivery order'}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-[28px]">
              {order.orderNumber}
            </h1>
            <p className="mt-1.5 text-[13px] text-white/60">
              Placed {formatDate(order.createdAt, true)} ·{' '}
              {order.paymentMethod === 'PICKUP' ? 'Manual payment on pickup' : 'Stripe card payment'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{order.status}</Badge>
            <Badge>{order.paymentStatus}</Badge>
          </div>
        </div>
        <div className="grid gap-px border-t border-white/8 bg-white/8 sm:grid-cols-3">
          <div className="bg-navy px-5 py-3.5">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">Items</p>
            <p className="mt-1 font-display text-lg font-bold text-white">{order.items.length}</p>
          </div>
          <div className="bg-navy px-5 py-3.5">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">Total</p>
            <p className="mt-1 font-display text-lg font-bold text-cyan">
              {formatCents(order.totalCents)}
            </p>
          </div>
          <div className="bg-navy px-5 py-3.5">
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/40 uppercase">Customer</p>
            <p className="mt-1 truncate font-display text-[15px] font-bold text-white">
              {order.contactName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                <Package className="h-4 w-4 text-cyan-dim" />
                Items
              </h2>
              <span className="text-[12px] text-muted">
                {order.items.length} line{order.items.length === 1 ? '' : 's'}
              </span>
            </div>

            <ul className="divide-y divide-black/5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {item.image ? (
                    <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#f2f2f2]">
                      <img
                        src={assetUrl(item.image)}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement?.remove()
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-bold text-ink">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {item.dose} · {formatCents(item.unitPriceCents)} each
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-fog px-2.5 py-1 text-[11px] font-semibold text-ink">
                      Qty {item.qty}
                    </p>
                  </div>
                  <p className="font-display text-[16px] font-bold text-ink">
                    {formatCents(item.lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 border-t border-black/6 bg-fog/40 px-5 py-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-ink">{formatCents(order.subtotalCents)}</span>
              </div>
              {order.discountCents > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">
                    Bulk reward{order.discountLabel ? ` (${order.discountLabel})` : ''}
                  </span>
                  <span className="font-medium text-emerald-600">
                    -{formatCents(order.discountCents)}
                  </span>
                </div>
              ) : null}
              {order.creditCents > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">Account credit used</span>
                  <span className="font-medium text-emerald-600">
                    -{formatCents(order.creditCents)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted">{isPickup ? 'Warehouse pickup' : 'Shipping'}</span>
                <span className="font-medium text-ink">
                  {isPickup ? 'Free' : formatCents(order.shippingCents)}
                </span>
              </div>
              <div className="flex items-end justify-between border-t border-black/8 pt-3">
                <span className="font-semibold text-ink">Order total</span>
                <span className="font-display text-2xl font-bold text-ink">
                  {formatCents(order.totalCents)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-display text-[15px] font-bold text-ink">Timeline</h2>
            {order.events?.length ? (
              <ol className="relative space-y-0 border-l border-cyan/30 pl-5">
                {order.events.map((event, index) => (
                  <li
                    key={event.id}
                    className={`relative ${index < order.events.length - 1 ? 'pb-5' : ''}`}
                  >
                    <span className="absolute top-1.5 -left-[1.41rem] h-2.5 w-2.5 rounded-full bg-cyan ring-4 ring-white" />
                    <p className="text-[13px] leading-snug font-medium text-ink">{event.message}</p>
                    <p className="mt-1 text-[11px] text-muted">{formatDate(event.createdAt, true)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13px] text-muted">No events yet.</p>
            )}
            {trackUrl ? (
              <div className="mt-5 border-t border-black/6 pt-4">
                <p className="mb-3 text-[12px] leading-relaxed text-muted">
                  {carrierTrackName(order)} scans are checked every minute and added here. The order
                  is marked delivered when the carrier says it was delivered.
                </p>
                <Button as="a" href={trackUrl} target="_blank" rel="noreferrer" variant="outline" className="w-full">
                  Track shipment
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Fulfilment</h2>
            <div className="space-y-3">
              <div className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-ink">Order status</span>
                {autoFulfillment ? (
                  <div className="flex items-center justify-between rounded-xl border border-black/8 bg-fog px-3.5 py-2.5">
                    <Badge>{order.status}</Badge>
                    <span className="text-[11px] font-medium text-muted">Auto</span>
                  </div>
                ) : (
                  <Select
                    value={order.status}
                    disabled={busy}
                    onChange={(event) => changeStatus(event.target.value)}
                  >
                    {STATUSES.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry.charAt(0) + entry.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {autoFulfillment ? (
                <div className="flex flex-col gap-2">
                  {order.status === 'SHIPPED' ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => changeStatus('DELIVERED')}
                    >
                      Mark delivered
                    </Button>
                  ) : null}
                  {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' ? (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => changeStatus('CANCELLED')}
                    >
                      Cancel order
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <Button variant="danger" className="w-full" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Delete order
              </Button>

              <div className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <CreditCard className="h-3.5 w-3.5 text-cyan-dim" />
                  Payment status
                </span>
                {isManualPayment ? (
                  <Select
                    value={order.paymentStatus}
                    disabled={busy}
                    onChange={(event) => changePayment(event.target.value)}
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-black/8 bg-fog px-3.5 py-2.5">
                      <Badge>{order.paymentStatus}</Badge>
                      <span className="text-[11px] font-medium text-muted">
                        {order.paymentStatus === 'UNPAID' ? 'Stripe' : 'Locked'}
                      </span>
                    </div>
                    {order.paymentStatus === 'UNPAID' &&
                    !isStore &&
                    !['CANCELLED', 'REFUNDED'].includes(order.status) ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={busy}
                          onClick={syncStripePayment}
                        >
                          {busy ? 'Checking Stripe…' : 'Sync from Stripe'}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full"
                          disabled={busy}
                          onClick={() => changePayment('PAID')}
                        >
                          Mark paid
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {!isPickup && order.paymentStatus === 'PAID' && !order.trackingCode ? (
                <form
                  onSubmit={saveTracking}
                  className="rounded-2xl border border-cyan/30 bg-cyan/5 p-3.5"
                >
                  <label
                    htmlFor="tracking-code"
                    className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink"
                  >
                    <Truck className="h-3.5 w-3.5 text-cyan-dim" />
                    Tracking number
                  </label>
                  <p className="mb-3 text-[12px] leading-relaxed text-muted">
                    Buy this method in Pirate Ship, then paste the tracking number.
                  </p>
                  <Input
                    id="tracking-code"
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value)}
                    placeholder="1Z… or 9400…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    type="submit"
                    className="mt-2.5 w-full"
                    disabled={busy || trackingCode.trim().length < 4}
                  >
                    {busy ? 'Saving…' : 'Save tracking'}
                  </Button>
                </form>
              ) : !isPickup && order.trackingCode ? (
                <div className="rounded-2xl border border-black/6 bg-fog px-3.5 py-3">
                  <p className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
                    Tracking
                  </p>
                  <p className="mt-1 font-mono text-[13px] font-semibold break-all text-ink">
                    {order.trackingCode}
                  </p>
                  {trackUrl ? (
                    <Button
                      as="a"
                      href={trackUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                      className="mt-3 w-full"
                    >
                      Track shipment
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {autoFulfillment ? (
                <p className="rounded-2xl border border-black/6 bg-fog px-3.5 py-3 text-[12px] leading-relaxed text-muted">
                  Processing after Stripe payment. Shipped when you paste a USPS or UPS tracking
                  number. Scans are checked every minute. Delivered is set when the carrier
                  confirms it.
                </p>
              ) : !isManualPayment ? (
                <p className="rounded-2xl border border-black/6 bg-fog px-3.5 py-3 text-[12px] leading-relaxed text-muted">
                  Paid via Stripe — payment status is updated automatically and cannot be edited
                  here.
                </p>
              ) : order.paymentStatus === 'UNPAID' ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-800">
                  Warehouse pickup — mark paid when the customer settles at collection.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              {isPickup ? (
                <Warehouse className="h-4 w-4 text-cyan-dim" />
              ) : (
                <Truck className="h-4 w-4 text-cyan-dim" />
              )}
              {isPickup ? 'Pickup' : 'Shipping'}
            </h2>

            {isPickup ? (
              <div className="rounded-2xl bg-fog px-4 py-4">
                {order.pickupLocation ? (
                  <div className="mb-3">
                    <p className="font-display text-[14px] font-bold text-ink">
                      {order.pickupLocation.name}
                    </p>
                    {(order.pickupLocation.lines || []).map((line) => (
                      <p key={line} className="text-[13px] text-muted">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="text-[13px] leading-relaxed text-muted">
                  No carrier label needed. Hand over the order at this location once payment is
                  confirmed.
                </p>
              </div>
            ) : order.labelUrl ? (
              <div className="space-y-3 text-[13px]">
                <div className="space-y-2 rounded-2xl bg-fog px-4 py-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Carrier</span>
                    <span className="text-right font-semibold text-ink">
                      {order.carrier} {order.service}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Shipping paid</span>
                    <span className="text-right font-semibold text-ink">
                      {formatCents(order.shippingCents)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Tracking</span>
                    <span className="text-right font-semibold text-ink">{order.trackingCode}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => setLabelPreview(true)}>
                    <Eye className="h-4 w-4" />
                    View label
                  </Button>
                  <Button variant="outline" onClick={downloadLabel} disabled={busy}>
                    <Download className="h-4 w-4" />
                    {busy ? 'Downloading…' : 'Download label'}
                  </Button>
                  {trackUrl ? (
                    <Button
                      as="a"
                      href={trackUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                    >
                      Track shipment
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-[13px]">
                <ShipFields order={order} />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <User className="h-4 w-4 text-cyan-dim" />
              Customer
            </h2>
            <div className="rounded-2xl bg-fog px-4 py-4">
              <p className="font-display text-[15px] font-bold text-ink">{order.contactName}</p>
              {order.customer?.company ? (
                <p className="mt-0.5 text-[12px] text-muted">{order.customer.company}</p>
              ) : null}
              <div className="mt-3 space-y-1 text-[13px] text-muted">
                <p>{order.contactEmail}</p>
                <p>{order.contactPhone}</p>
              </div>
            </div>

            {order.address ? (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <MapPin className="h-3.5 w-3.5 text-cyan-dim" />
                  Delivery address
                </p>
                <div className="rounded-2xl border border-black/6 px-4 py-3 text-[13px] leading-relaxed text-muted">
                  <p>{order.address.line1}</p>
                  {order.address.line2 ? <p>{order.address.line2}</p> : null}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.zip}
                  </p>
                  <p>{order.address.country}</p>
                </div>
              </div>
            ) : null}

            {order.notes ? (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-semibold text-ink">Customer notes</p>
                <p className="rounded-2xl border border-black/6 px-4 py-3 text-[13px] leading-relaxed text-muted">
                  {order.notes}
                </p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => {
          if (!busy) setConfirmDelete(false)
        }}
        title="Delete this order?"
        size="sm"
        footer={
          <>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>
              Keep order
            </Button>
            <Button variant="danger" disabled={busy} onClick={deleteOrder}>
              {busy ? 'Deleting…' : 'Delete order'}
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink">
          <span className="font-semibold">{order.orderNumber}</span> will be removed from the admin
          list.
          {isStore ? '' : ' Stock and store credit are returned.'}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          A Stripe card charge is not refunded from here.
        </p>
      </Modal>

      <Modal
        open={labelPreview}
        onClose={() => setLabelPreview(false)}
        title="Shipping label"
        size="lg"
        footer={
          <Button variant="primary" onClick={downloadLabel} disabled={busy}>
            <Download className="h-4 w-4" />
            {busy ? 'Downloading…' : 'Download label'}
          </Button>
        }
      >
        {order.labelUrl ? (
          isImageDocument(order.labelUrl) ? (
            <img
              src={order.labelUrl}
              alt={`Shipping label for ${order.orderNumber}`}
              className="mx-auto max-h-[70vh] w-auto rounded-xl border border-black/8 bg-white object-contain"
            />
          ) : (
            <iframe
              src={pdfViewerUrl(order.labelUrl)}
              title={`Shipping label for ${order.orderNumber}`}
              className="h-[70vh] w-full rounded-xl border border-black/8 bg-white"
            />
          )
        ) : null}
      </Modal>
    </>
  )
}
