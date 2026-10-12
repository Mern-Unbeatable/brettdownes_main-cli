import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, Eye, Search } from 'lucide-react'
import ShipFields from './ShipFields'
import { api, formatCents, getAuthToken } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
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
const SEEN_NEW_ORDERS_KEY = 'admin-new-order-seen-ids'

function readSeenNewOrderIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_NEW_ORDERS_KEY) || '[]')
    return new Set(Array.isArray(raw) ? raw.filter(Boolean) : [])
  } catch {
    return new Set()
  }
}

function rememberNewOrderIds(ids) {
  const seen = readSeenNewOrderIds()
  ids.forEach((id) => seen.add(id))
  localStorage.setItem(SEEN_NEW_ORDERS_KEY, JSON.stringify([...seen].slice(-400)))
}

function NewOrdersPanel() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/api/admin/orders/new')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const downloadSheet = async () => {
    setBusy(true)
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const token = getAuthToken()
      const response = await fetch(`${base}/api/admin/orders/new/export`, {
        credentials: 'include',
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not download the spreadsheet.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pirate-ship-new-orders.xlsx'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const orders = data?.orders || []

  return (
    <>
      <Card className="mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">Pirate Ship spreadsheet</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
              Download the queue and drop it into Pirate Ship. Open an order and paste the tracking
              number on the detail page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={downloadSheet} disabled={busy || orders.length === 0}>
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading new orders" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No new orders"
          message="Paid delivery orders appear here until a tracking number is uploaded."
        />
      ) : (
        <Reveal>
          <Card padded={false} className="overflow-hidden">
            <div className="hidden lg:block">
              <table className="w-full text-left">
                <thead className="border-b border-black/6 bg-fog/60">
                  <tr className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Shipping</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                    <tr className="transition hover:bg-fog/50">
                      <td className="px-5 py-3.5 font-display text-[16px] font-bold text-ink">
                        {order.queueNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-ink">{order.orderNumber}</p>
                        <p className="text-[11px] text-muted">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] text-ink">{order.contactName}</p>
                        <p className="text-[11px] text-muted">{order.contactEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-ink">
                        {order.carrier ? `${order.carrier} ${order.service || ''}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-semibold text-ink">
                        {formatCents(order.shippingCents)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          aria-label={`View ${order.orderNumber}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan-dim transition hover:bg-cyan/25 hover:text-navy"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                    <tr className="hover:bg-transparent">
                      <td colSpan={6} className="px-5 pt-0 pb-4">
                        <ShipFields order={order} />
                      </td>
                    </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-black/5 lg:hidden">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link to={`/admin/orders/${order.id}`} className="block px-5 py-4">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                      {order.queueNumber}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-[12px] text-muted">{order.contactName}</p>
                    <p className="mt-1 text-[13px] font-medium text-ink">
                      {order.carrier ? `${order.carrier} ${order.service || ''}` : 'Method pending'} ·{' '}
                      {formatCents(order.shippingCents)}
                    </p>
                  </Link>
                  <div className="px-5 pb-4">
                    <ShipFields order={order} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}
    </>
  )
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(params.get('search') || '')
  const [queueIds, setQueueIds] = useState([])
  const [seenTick, setSeenTick] = useState(0)

  const tab = params.get('tab') === 'new' ? 'new' : 'all'
  const status = params.get('status') || ''
  const paymentStatus = params.get('paymentStatus') || ''
  const fulfillment = params.get('fulfillment') || ''
  const userId = params.get('userId') || ''
  const page = Number(params.get('page') || 1)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const clearCustomerFilter = () => {
    const next = new URLSearchParams(params)
    next.delete('userId')
    next.delete('page')
    setParams(next)
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(null)

    const query = new URLSearchParams()
    if (params.get('search')) query.set('search', params.get('search'))
    if (userId) query.set('userId', userId)
    if (status) query.set('status', status)
    if (paymentStatus) query.set('paymentStatus', paymentStatus)
    if (fulfillment) query.set('fulfillment', fulfillment)
    query.set('page', String(page))

    api
      .get(`/api/admin/orders?${query.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params, status, paymentStatus, fulfillment, userId, page])

  useEffect(load, [load])

  const refreshQueue = useCallback(() => {
    api
      .get('/api/admin/orders/new')
      .then((payload) => setQueueIds((payload.orders || []).map((order) => order.id)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshQueue()
    const timer = window.setInterval(refreshQueue, 20000)
    return () => window.clearInterval(timer)
  }, [refreshQueue])

  useEffect(() => {
    if (tab !== 'new' || queueIds.length === 0) return
    rememberNewOrderIds(queueIds)
    setSeenTick((value) => value + 1)
  }, [tab, queueIds])

  const seenIds = useMemo(() => readSeenNewOrderIds(), [seenTick])
  const unseenCount = tab === 'new' ? 0 : queueIds.filter((id) => !seenIds.has(id)).length

  const openNewOrders = () => {
    rememberNewOrderIds(queueIds)
    setSeenTick((value) => value + 1)
    setParam('tab', 'new')
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setParam('search', search.trim())
  }

  const orders = data?.orders || []

  return (
    <>
      <PageHeading
        title="Orders"
        subtitle={
          tab === 'new'
            ? 'Paid delivery orders waiting for a Pirate Ship label'
            : data
              ? `${data.total} order${data.total === 1 ? '' : 's'}`
              : 'Loading…'
        }
      />

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setParam('tab', '')}
          className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${
            tab === 'all' ? 'bg-ink text-white' : 'bg-fog text-ink hover:bg-fog-deep'
          }`}
        >
          All orders
        </button>
        <button
          type="button"
          onClick={openNewOrders}
          className={`relative rounded-xl px-4 py-2 text-[13px] font-semibold transition ${
            tab === 'new' ? 'bg-ink text-white' : 'bg-fog text-ink hover:bg-fog-deep'
          }`}
        >
          New orders
          {unseenCount > 0 ? (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1.5 text-[11px] font-bold text-navy">
              {unseenCount}
            </span>
          ) : null}
        </button>
      </div>

      {tab === 'new' ? <NewOrdersPanel /> : null}
      {tab === 'all' ? (
      <>
      {userId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan/25 bg-cyan/5 px-4 py-3">
          <p className="text-[13px] text-ink">
            Showing orders for one customer
            {orders[0]?.contactName || orders[0]?.contactEmail
              ? ` · ${orders[0]?.contactName || orders[0]?.contactEmail}`
              : ''}
          </p>
          <Button size="sm" variant="outline" onClick={clearCustomerFilter}>
            Clear filter
          </Button>
        </div>
      ) : null}

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
          <Select
            value={fulfillment}
            onChange={(event) => setParam('fulfillment', event.target.value)}
            className="w-full sm:w-40"
          >
            <option value="">Any method</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading orders" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          message="Try clearing the filters, or wait for the next order to come in."
        />
      ) : (
        <Reveal stagger={0.03}>
          <Card padded={false} className="overflow-hidden">
            {/* Table on desktop, stacked cards on mobile. */}
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
                        <Badge>{order.fulfillment}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>{order.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>{order.paymentStatus}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-semibold text-ink">
                        {formatCents(order.totalCents)}
                        {order.creditCents > 0 ? (
                          <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                            −{formatCents(order.creditCents)} credit
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
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
                  <Link to={`/admin/orders/${order.id}`} className="block px-5 py-4 transition hover:bg-fog/50">
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
                      <Badge>{order.fulfillment}</Badge>
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
      ) : null}
    </>
  )
}
