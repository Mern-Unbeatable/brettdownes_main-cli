import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Package, Search, Truck } from 'lucide-react'
import { api, ApiError, formatCents } from '../../../lib/api'
import {
  Card,
  EmptyState,
  ErrorBlock,
  Input,
  LoadingBlock,
  PageHeading,
  Select,
  formatDate,
} from '../ui'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const STATUS_TONE = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-sky-100 text-sky-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  REFUNDED: 'bg-gray-200 text-gray-600',
}

const PAYMENT_TONE = {
  PAID: 'bg-emerald-100 text-emerald-700',
  UNPAID: 'bg-amber-100 text-amber-700',
  REFUNDED: 'bg-gray-200 text-gray-600',
}

function StatusPill({ value, tones }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
        tones[value] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {value}
    </span>
  )
}

export default function AdminWholesaleOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())
      const qs = params.toString()
      const result = await api.get(`/api/wholesale/admin/orders${qs ? `?${qs}` : ''}`)
      setOrders(result.orders || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === 'PAID')
    return {
      total: orders.length,
      awaiting: orders.filter((order) => ['PENDING', 'PROCESSING'].includes(order.status)).length,
      revenueCents: paid.reduce((sum, order) => sum + order.totalCents, 0),
    }
  }, [orders])

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="Other orders"
        subtitle="Orders placed through the private /other store. Each is managed separately from the main shop."
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

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-5 py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              load()
            }}
            className="relative flex-1 min-w-[200px]"
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order #, name, email, tracking…"
              className="pl-9"
            />
          </form>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-auto"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <LoadingBlock label="Loading orders" />
        ) : error ? (
          <div className="p-5">
            <ErrorBlock message={error} onRetry={load} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No orders yet"
              message="Orders placed on the /other store will appear here."
              icon={Package}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-fog text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6 text-[13px]">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-fog/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/store-orders/${order.id}`}
                        className="font-mono text-[12px] font-semibold text-cyan-dim hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{order.contactName}</p>
                      <p className="text-[12px] text-muted">{order.contactEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {formatCents(order.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill value={order.paymentStatus} tones={PAYMENT_TONE} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill value={order.status} tones={STATUS_TONE} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/store-orders/${order.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-fog text-muted transition hover:text-ink"
                          aria-label="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
