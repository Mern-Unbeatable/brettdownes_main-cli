import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, ShoppingBag, Truck, Wallet } from 'lucide-react'
import { api, assetUrl, formatCents } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  Reveal,
  StatCard,
  formatDate,
} from '../ui'

export default function UserOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/orders/mine')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingBlock label="Loading your dashboard" />
  if (error) return <ErrorBlock message={error} onRetry={load} />

  const { orders = [], stats = {} } = data || {}
  const recent = orders.slice(0, 5)

  return (
    <>
      <PageHeading
        title="Overview"
        subtitle={`Signed in as ${user?.email}`}
        actions={
          <Button as={Link} to="/shop" variant="dark">
            Browse catalogue
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={stats.total ?? 0} icon={Package} tone="cyan" />
        <StatCard label="In transit" value={stats.inTransit ?? 0} icon={Truck} tone="navy" />
        <StatCard label="Delivered" value={stats.delivered ?? 0} icon={ShoppingBag} />
        <StatCard
          label="Total spent"
          value={formatCents(stats.spentCents ?? 0)}
          hint="Across paid orders"
          icon={Wallet}
          tone="cyan"
        />
      </Reveal>

      <div className="mt-6">
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <h2 className="font-display text-[15px] font-bold text-ink">Recent orders</h2>
            {orders.length > 0 ? (
              <Link
                to="/dashboard/orders"
                className="text-[12px] font-semibold text-cyan-dim transition hover:text-ink"
              >
                View all
              </Link>
            ) : null}
          </div>

          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet"
                message="Your research orders will appear here once you place your first one."
                action={
                  <Button as={Link} to="/shop" variant="primary">
                    Open the shop
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-black/6">
              {recent.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/dashboard/orders/${order.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-fog/60"
                  >
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item) => (
                        <img
                          key={item.id}
                          src={assetUrl(item.image)}
                          alt=""
                          className="h-10 w-10 rounded-xl border-2 border-white bg-fog object-cover"
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {order.orderNumber}
                      </p>
                      <p className="text-[12px] text-muted">
                        {formatDate(order.createdAt)} · {order.items.length} item
                        {order.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                    <p className="font-display text-[15px] font-bold text-ink">
                      {formatCents(order.totalCents)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
