import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, Package, Search, Truck } from 'lucide-react'
import { api, ApiError, formatCents } from '../../../lib/api'
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

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

export default function AdminWholesaleOrders() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('search') || '')

  const status = params.get('status') || ''
  const paymentStatus = params.get('paymentStatus') || ''
  const page = Number(params.get('page') || 1)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    const query = new URLSearchParams()
    if (params.get('search')) query.set('search', params.get('search'))
    if (status) query.set('status', status)
    if (paymentStatus) query.set('paymentStatus', paymentStatus)
    query.set('page', String(page))

    api
      .get(`/api/wholesale/admin/orders?${query.toString()}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load orders.'))
      .finally(() => setLoading(false))
  }, [params, status, paymentStatus, page])

  useEffect(load, [load])

  const submitSearch = (event) => {
    event.preventDefault()
    setParam('search', search.trim())
  }

  const orders = data?.orders || []
  const stats = data?.stats || { total: 0, awaiting: 0, revenueCents: 0 }
  const filtered = Boolean(params.get('search') || status || paymentStatus)

  return (
    <>
      <PageHeading
        title="Other orders"
        subtitle={
          data
            ? `${data.total} order${data.total === 1 ? '' : 's'}${filtered ? ' matching filters' : ''}`
            : 'Orders placed through the private /other store.'
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-cyan">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Orders</p>
            <p className="font-display text-xl font-bold text-ink">{stats.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-cyan">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
              To fulfil
            </p>
            <p className="font-display text-xl font-bold text-ink">{stats.awaiting}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-cyan">
            <span className="text-base font-bold">$</span>
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Paid</p>
            <p className="font-display text-xl font-bold text-ink">
              {formatCents(stats.revenueCents)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <form onSubmit={submitSearch} className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order number, customer or tracking"
              className="pl-9"
            />
          </form>
          <Select
            value={status}
            onChange={(event) => setParam('status', event.target.value)}
            className="w-full sm:w-44"
          >
            <option value="">All statuses</option>
            {STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry.charAt(0) + entry.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <Select
            value={paymentStatus}
            onChange={(event) => setParam('paymentStatus', event.target.value)}
            className="w-full sm:w-40"
          >
            <option value="">Any payment</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading orders" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          title={filtered ? 'No orders found' : 'No orders yet'}
          message={
            filtered
              ? 'Try clearing the filters, or wait for the next order to come in.'
              : 'Orders placed on the /other store will appear here.'
          }
        />
      ) : (
        <Reveal stagger={0.03}>
          <Card padded={false} className="overflow-hidden">
            <div className="hidden lg:block">
              <table className="w-full text-left">
                <thead className="border-b border-black/6 bg-fog/60">
                  <tr className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-fog/50">
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-ink">{order.orderNumber}</p>
                        <p className="text-[11px] text-muted">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] text-ink">{order.contactName}</p>
                        <p className="text-[11px] text-muted">{order.contactEmail}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>DELIVERY</Badge>
                        {order.shippingLabel ? (
                          <p className="mt-1 text-[11px] text-muted">{order.shippingLabel}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>{order.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>{order.paymentStatus}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-semibold text-ink">
                        {formatCents(order.totalCents)}
                        {order.discountCents > 0 ? (
                          <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                            −{formatCents(order.discountCents)} coupon
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/store-orders/${order.id}`}
                          aria-label={`View ${order.orderNumber}`}
                          title="View order"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan-dim transition hover:bg-cyan/25 hover:text-navy"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-black/5 lg:hidden">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/store-orders/${order.id}`}
                    className="block px-5 py-4 transition hover:bg-fog/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">{order.orderNumber}</p>
                        <p className="truncate text-[12px] text-muted">
                          {order.contactName} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <p className="font-display text-[15px] font-bold text-ink">
                          {formatCents(order.totalCents)}
                        </p>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan-dim">
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge>{order.status}</Badge>
                      <Badge>{order.paymentStatus}</Badge>
                      <Badge>DELIVERY</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {data.pages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <p className="text-[12px] text-muted">
                Page {page} of {data.pages}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </Reveal>
      )}
    </>
  )
}
