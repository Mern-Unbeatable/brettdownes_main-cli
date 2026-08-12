import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Truck,
  User,
  Warehouse,
} from 'lucide-react'
import { api, assetUrl, formatCents } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  ErrorBlock,
  LoadingBlock,
  Modal,
  Select,
  Spinner,
  formatDate,
} from '../ui'

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [labelModal, setLabelModal] = useState(false)
  const [rates, setRates] = useState([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [selectedRate, setSelectedRate] = useState('')

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
      .get(`/api/admin/orders/${id}`)
      .then((data) => {
        if (!cancelled) setOrder(data.order)
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
  }, [id])

  const load = () => {
    setLoading(true)
    setShowLoader(true)
    setError(null)
    api
      .get(`/api/admin/orders/${id}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false)
        setShowLoader(false)
      })
  }

  const changeStatus = async (status) => {
    setBusy(true)
    try {
      const data = await api.patch(`/api/admin/orders/${id}/status`, {
        status,
        notifyCustomer: true,
      })
      setOrder(data.order)
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
      const data = await api.patch(`/api/admin/orders/${id}/payment`, { paymentStatus })
      setOrder(data.order)
      toast.success(`Payment marked as ${paymentStatus.toLowerCase()}.`, { title: 'Updated' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openLabelModal = async () => {
    setLabelModal(true)
    setRatesLoading(true)
    setRates([])
    try {
      let data
      try {
        data = await api.get(`/api/admin/orders/${id}/rates`)
      } catch {
        data = await api.post(`/api/admin/orders/${id}/rates`)
      }
      setRates(data.rates || [])
      setSelectedRate(order?.easypostRateId || data.rates?.[0]?.id || '')
    } catch (err) {
      toast.error(err.message)
      setLabelModal(false)
    } finally {
      setRatesLoading(false)
    }
  }

  const requoteRates = async () => {
    setRatesLoading(true)
    try {
      const data = await api.post(`/api/admin/orders/${id}/rates`)
      setRates(data.rates || [])
      setSelectedRate(data.rates?.[0]?.id || '')
      toast.success('Fresh carrier rates loaded.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRatesLoading(false)
    }
  }

  const buyLabel = async () => {
    if (!selectedRate) {
      toast.error('Choose a carrier rate first.')
      return
    }

    setBusy(true)
    try {
      const data = await api.post(`/api/admin/orders/${id}/label`, { rateId: selectedRate })
      setOrder(data.order)
      setLabelModal(false)
      toast.success('Label purchased and the customer has been emailed.', { title: 'Shipped' })
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

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/admin/orders')}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <div className="relative mb-5 overflow-hidden rounded-3xl bg-navy text-white shadow-sm">
        {busy ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-navy/40 backdrop-blur-[1px]">
            <Spinner className="h-6 w-6 border-white/20 border-t-cyan" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 md:px-6 md:py-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] text-cyan uppercase">
              {isPickup ? 'Warehouse pickup' : 'Delivery order'}
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
                  <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#f2f2f2]">
                    <img
                      src={assetUrl(item.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
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
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Fulfilment</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-ink">Order status</span>
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
              </label>

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
                  <div className="flex items-center justify-between rounded-xl border border-black/8 bg-fog px-3.5 py-2.5">
                    <Badge>{order.paymentStatus}</Badge>
                    <span className="text-[11px] font-medium text-muted">Locked</span>
                  </div>
                )}
              </div>

              {!isManualPayment ? (
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
              {isPickup ? 'Pickup' : 'Shipping label'}
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
                    <span className="text-muted">Tracking</span>
                    <span className="text-right font-semibold text-ink">{order.trackingCode}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    as="a"
                    href={order.labelUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                  >
                    <Printer className="h-4 w-4" />
                    Print label
                  </Button>
                  {order.trackingUrl ? (
                    <Button
                      as="a"
                      href={order.trackingUrl}
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
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed text-muted">
                  Buy postage through EasyPost. Tracking is emailed automatically and the order moves
                  to shipped.
                </p>
                <Button variant="primary" onClick={openLabelModal} disabled={busy}>
                  <Printer className="h-4 w-4" />
                  Buy shipping label
                </Button>
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
        open={labelModal}
        onClose={() => setLabelModal(false)}
        title="Buy shipping label"
        footer={
          <>
            <Button variant="ghost" onClick={requoteRates} disabled={ratesLoading}>
              <RefreshCw className={`h-4 w-4 ${ratesLoading ? 'animate-spin' : ''}`} />
              Re-quote
            </Button>
            <Button variant="primary" onClick={buyLabel} disabled={busy || !selectedRate}>
              {busy ? 'Purchasing…' : 'Buy label'}
            </Button>
          </>
        }
      >
        {ratesLoading ? (
          <p className="py-8 text-center text-[13px] text-muted">Fetching carrier rates…</p>
        ) : rates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted">
            No rates available. Try re-quoting, or check the delivery address.
          </p>
        ) : (
          <ul className="space-y-2">
            {rates.map((rate) => (
              <li key={rate.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    selectedRate === rate.id
                      ? 'border-cyan bg-cyan/5'
                      : 'border-black/10 hover:border-black/25'
                  }`}
                >
                  <input
                    type="radio"
                    name="rate"
                    value={rate.id}
                    checked={selectedRate === rate.id}
                    onChange={() => setSelectedRate(rate.id)}
                    className="h-4 w-4 accent-[#00c4ab]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">
                      {rate.carrier} {rate.service}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {rate.deliveryDays
                        ? `${rate.deliveryDays} business days`
                        : 'Transit time varies'}
                    </span>
                  </span>
                  <span className="font-display text-[15px] font-bold text-ink">
                    {formatCents(rate.amountCents)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
