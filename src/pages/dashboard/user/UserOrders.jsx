import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Search } from 'lucide-react'
import { api, assetUrl, formatCents } from '../../../lib/api'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  Input,
  LoadingBlock,
  PageHeading,
  Reveal,
  Select,
  formatDate,
} from '../ui'

const STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

export default function UserOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/orders/mine')
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (status !== 'ALL' && order.status !== status) return false
      if (!term) return true
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.items.some((item) => item.productName.toLowerCase().includes(term))
      )
    })
  }, [orders, search, status])

  return (
    <>
      <PageHeading title="My orders" subtitle="Track every research order and its shipment." />

      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number or product"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full sm:w-48"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All statuses' : option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading orders" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={orders.length ? 'No matching orders' : 'No orders yet'}
          message={
            orders.length
              ? 'Try a different search term or status filter.'
              : 'Once you place an order it will show up here with live tracking.'
          }
          action={
            orders.length ? null : (
              <Button as={Link} to="/shop" variant="primary">
                Open the shop
              </Button>
            )
          }
        />
      ) : (
        <Reveal className="space-y-4" stagger={0.05}>
          {filtered.map((order) => (
            <Card key={order.id} padded={false}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-bold text-ink">{order.orderNumber}</p>
                  <p className="text-[12px] text-muted">
                    Placed {formatDate(order.createdAt, true)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{order.status}</Badge>
                  <Badge>{order.paymentStatus}</Badge>
                  <Badge>{order.fulfillment}</Badge>
                </div>
              </div>

              <ul className="divide-y divide-black/5">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                    {item.image ? (
                      <img
                        src={assetUrl(item.image)}
                        alt=""
                        className="h-12 w-12 rounded-xl bg-fog object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-fog" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {item.productName}
                      </p>
                      <p className="text-[12px] text-muted">
                        {item.dose} x {item.qty}
                      </p>
                    </div>
                    <p className="text-[13px] font-medium text-ink">
                      {formatCents(item.lineTotalCents)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 bg-fog/50 px-5 py-4">
                <div className="text-[12px] text-muted">
                  {order.trackingCode ? (
                    <span>
                      {order.carrier} {order.service} ·{' '}
                      <span className="font-semibold text-ink">{order.trackingCode}</span>
                    </span>
                  ) : order.fulfillment === 'PICKUP' ? (
                    'Warehouse pickup — payment due on collection'
                  ) : (
                    'Tracking appears once the label is created'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {order.trackingUrl ? (
                    <Button
                      as="a"
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline"
                      size="sm"
                    >
                      Track
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  <Button as={Link} to={`/dashboard/orders/${order.id}`} variant="primary" size="sm">
                    Details
                  </Button>
                  <p className="font-display text-[16px] font-bold text-ink">
                    {formatCents(order.totalCents)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </Reveal>
      )}
    </>
  )
}
