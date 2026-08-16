import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Truck } from 'lucide-react'
import { api, assetUrl, formatCents } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  Reveal,
  formatDate,
} from '../ui'

export default function UserOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get(`/api/orders/mine/${id}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const cancelOrder = async () => {
    setCancelling(true)
    try {
      const data = await api.post(`/api/orders/mine/${id}/cancel`)
      setOrder(data.order)
      toast.success('Order cancelled.', { title: 'Cancelled' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const completePayment = async () => {
    setPaying(true)
    try {
      const session = await api.post('/api/payments/checkout-session', { orderId: id })
      if (!session?.url) throw new Error('Could not start Stripe Checkout.')
      window.location.assign(session.url)
    } catch (err) {
      setPaying(false)
      toast.error(err.message)
    }
  }

  if (loading) return <LoadingBlock label="Loading order" />
  if (error) return <ErrorBlock message={error} onRetry={load} />
  if (!order) return null

  const canCancel = order.status === 'PENDING' && order.paymentStatus !== 'PAID'
  const canPay =
    order.paymentMethod === 'STRIPE' &&
    order.paymentStatus !== 'PAID' &&
    order.status !== 'CANCELLED'

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/dashboard/orders')}
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <PageHeading
        title={order.orderNumber}
        subtitle={`Placed ${formatDate(order.createdAt, true)}`}
        actions={
          <>
            <Badge>{order.status}</Badge>
            <Badge>{order.paymentStatus}</Badge>
            {canPay ? (
              <Button size="sm" onClick={completePayment} disabled={paying}>
                {paying ? 'Opening Stripe…' : 'Complete payment'}
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="outline" size="sm" onClick={cancelOrder} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </Button>
            ) : null}
          </>
        }
      />

      <Reveal className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card padded={false}>
            <h2 className="border-b border-black/6 px-5 py-4 font-display text-[15px] font-bold text-ink">
              Items
            </h2>
            <ul className="divide-y divide-black/5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-4">
                  <img
                    src={assetUrl(item.image)}
                    alt=""
                    className="h-14 w-14 rounded-xl bg-fog object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {item.productName}
                    </p>
                    <p className="text-[12px] text-muted">
                      {item.dose} · {formatCents(item.unitPriceCents)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-muted">x{item.qty}</p>
                    <p className="text-[13px] font-semibold text-ink">
                      {formatCents(item.lineTotalCents)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-black/6 px-5 py-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-ink">{formatCents(order.subtotalCents)}</span>
              </div>
              {order.discountCents > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted">
                    Bulk reward{order.discountLabel ? ` (${order.discountLabel})` : ''}
                  </span>
                  <span className="text-emerald-600">
                    -{formatCents(order.discountCents)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted">
                  {order.fulfillment === 'PICKUP' ? 'Warehouse pickup' : 'Shipping'}
                </span>
                <span className="text-ink">
                  {order.fulfillment === 'PICKUP' ? 'Free' : formatCents(order.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between border-t border-black/6 pt-2">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-display text-lg font-bold text-ink">
                  {formatCents(order.totalCents)}
                </span>
              </div>
            </div>
          </Card>

          {order.events?.length ? (
            <Card>
              <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Timeline</h2>
              <ol className="space-y-4">
                {order.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-ink">{event.message}</p>
                      <p className="text-[11px] text-muted">{formatDate(event.createdAt, true)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <Truck className="h-4 w-4 text-cyan-dim" />
              Shipment
            </h2>
            {order.fulfillment === 'PICKUP' ? (
              <div className="space-y-2 text-[13px]">
                {order.pickupLocation ? (
                  <div className="rounded-2xl bg-fog px-4 py-3">
                    <p className="font-semibold text-ink">{order.pickupLocation.name}</p>
                    {(order.pickupLocation.lines || []).map((line) => (
                      <p key={line} className="text-muted">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="leading-relaxed text-muted">
                  Bring your confirmation email and photo ID; payment is taken on collection.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Carrier</span>
                  <span className="text-right font-medium text-ink">
                    {order.carrier ? `${order.carrier} ${order.service || ''}` : 'Not assigned yet'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Tracking</span>
                  <span className="text-right font-medium text-ink">
                    {order.trackingCode || 'Pending'}
                  </span>
                </div>
                {order.trackingUrl ? (
                  <Button
                    as="a"
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="primary"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    Track shipment
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <MapPin className="h-4 w-4 text-cyan-dim" />
              {order.fulfillment === 'PICKUP' ? 'Contact' : 'Delivery address'}
            </h2>
            <div className="space-y-1 text-[13px] text-muted">
              <p className="font-medium text-ink">{order.contactName}</p>
              <p>{order.contactEmail}</p>
              <p>{order.contactPhone}</p>
              {order.address ? (
                <div className="mt-3 border-t border-black/6 pt-3">
                  <p>{order.address.line1}</p>
                  {order.address.line2 ? <p>{order.address.line2}</p> : null}
                  <p>
                    {order.address.city}, {order.address.state} {order.address.zip}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          {order.notes ? (
            <Card>
              <h2 className="mb-2 font-display text-[15px] font-bold text-ink">Your notes</h2>
              <p className="text-[13px] leading-relaxed text-muted">{order.notes}</p>
            </Card>
          ) : null}

          <Card>
            <p className="text-[12px] leading-relaxed text-muted">
              Need help with this order?{' '}
              <Link to="/contact" className="font-semibold text-cyan-dim hover:text-ink">
                Contact the team
              </Link>
              . For Research Use Only; Not for Human Consumption.
            </p>
          </Card>
        </div>
      </Reveal>
    </>
  )
}
