import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { AlertTriangle, DollarSign, Package, TrendingUp, UserCheck, Users } from 'lucide-react'
import { api, formatCents } from '../../../lib/api'
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

const CHART = { width: 640, height: 220, padX: 12, padTop: 18, padBottom: 28 }

function buildChartGeometry(series) {
  const values = series.map((point) => Number(point.cents) || 0)
  const peak = Math.max(...values, 0)
  const scalePeak = Math.max(peak, 1)
  const innerW = CHART.width - CHART.padX * 2
  const innerH = CHART.height - CHART.padTop - CHART.padBottom
  const gap = values.length > 20 ? 2 : 4
  const barW = Math.max(4, innerW / values.length - gap)

  const bars = values.map((cents, index) => {
    const x = CHART.padX + (index / values.length) * innerW + gap / 2
    const h = Math.max(cents > 0 ? 4 : 0, (cents / scalePeak) * innerH)
    const y = CHART.padTop + innerH - h
    return { x, y, w: barW, h, cents, date: series[index]?.date }
  })

  const linePoints = bars.map((bar) => ({
    x: bar.x + bar.w / 2,
    y: bar.cents > 0 ? bar.y : CHART.padTop + innerH,
  }))

  const line = linePoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')

  const area = `${line} L${linePoints.at(-1).x},${CHART.padTop + innerH} L${linePoints[0].x},${CHART.padTop + innerH} Z`

  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: CHART.padTop + innerH * (1 - ratio),
    label: formatCents(peak === 0 ? 0 : Math.round(scalePeak * ratio)),
  }))

  return { bars, line, area, ticks, peak, linePoints, innerH }
}

function RevenueChart({ series }) {
  const svgRef = useRef(null)
  const tipRef = useRef(null)
  const [hover, setHover] = useState(null)
  const uid = useId().replace(/:/g, '')
  const hasData = series.some((point) => point.cents > 0)
  const geometry = useMemo(() => buildChartGeometry(series), [series])

  useEffect(() => {
    const root = svgRef.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      const bars = root.querySelectorAll('[data-bar]')
      const line = root.querySelector('[data-line]')
      const area = root.querySelector('[data-area]')
      const dots = root.querySelectorAll('[data-dot]')
      const grids = root.querySelectorAll('[data-grid]')

      gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%' })
      gsap.set(grids, { opacity: 0 })
      if (area) gsap.set(area, { opacity: 0 })
      if (dots.length) gsap.set(dots, { scale: 0, transformOrigin: '50% 50%' })

      if (line) {
        const length = line.getTotalLength()
        gsap.set(line, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        })
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.to(grids, { opacity: 1, duration: 0.35, stagger: 0.05 }, 0)
      tl.to(
        bars,
        {
          scaleY: 1,
          duration: 0.85,
          stagger: { each: 0.018, from: 'start' },
          ease: 'power2.out',
        },
        0.08,
      )
      if (line) {
        tl.to(line, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.25)
      }
      if (area) {
        tl.to(area, { opacity: 1, duration: 0.7 }, 0.45)
      }
      if (dots.length) {
        tl.to(dots, { scale: 1, duration: 0.35, stagger: 0.03, ease: 'back.out(2)' }, 0.85)
      }
    }, root)

    return () => ctx.revert()
  }, [series])

  useEffect(() => {
    if (!tipRef.current || hover == null) return undefined
    const tween = gsap.fromTo(
      tipRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' },
    )
    return () => tween.kill()
  }, [hover?.index])

  const activeDots = geometry.bars
    .map((bar, index) => ({ ...bar, index }))
    .filter((bar) => bar.cents > 0)

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-[220px] w-full"
        role="img"
        aria-label="Revenue over the last 30 days"
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00f5d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f5d4" />
            <stop offset="100%" stopColor="#00c4ab" />
          </linearGradient>
          <linearGradient id={`${uid}-bar-mute`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {geometry.ticks.map((tick) => (
          <g key={tick.y} data-grid>
            <line
              x1={CHART.padX}
              x2={CHART.width - CHART.padX}
              y1={tick.y}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray={tick.label === formatCents(0) ? undefined : '4 6'}
            />
            <text
              x={CHART.width - 4}
              y={tick.y - 4}
              textAnchor="end"
              className="fill-muted"
              style={{ fontSize: 10, fontFamily: 'Outfit, sans-serif' }}
            >
              {tick.label}
            </text>
          </g>
        ))}

        {geometry.bars.map((bar, index) => (
          <rect
            key={bar.date || index}
            data-bar
            x={bar.x}
            y={hasData ? bar.y : CHART.padTop + geometry.innerH - 6}
            width={bar.w}
            height={hasData ? Math.max(bar.h, bar.cents > 0 ? 4 : 2) : 6}
            rx={Math.min(3, bar.w / 2)}
            fill={
              hasData && bar.cents > 0
                ? hover?.index === index
                  ? '#00f5d4'
                  : `url(#${uid}-bar)`
                : `url(#${uid}-bar-mute)`
            }
            opacity={hasData && bar.cents === 0 ? 0.35 : 1}
            className="cursor-pointer"
            onMouseEnter={() =>
              setHover({
                index,
                cents: bar.cents,
                date: bar.date,
                x: bar.x + bar.w / 2,
                y: hasData ? bar.y : CHART.padTop + geometry.innerH - 6,
              })
            }
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {hasData ? (
          <>
            <path data-area d={geometry.area} fill={`url(#${uid}-fill)`} />
            <path
              data-line
              d={geometry.line}
              fill="none"
              stroke="#0a121c"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {activeDots.map((dot) => (
              <circle
                key={`dot-${dot.index}`}
                data-dot
                cx={dot.x + dot.w / 2}
                cy={dot.y}
                r={hover?.index === dot.index ? 4.5 : 3.25}
                fill="#fff"
                stroke="#00c4ab"
                strokeWidth="2"
                className="pointer-events-none"
              />
            ))}
          </>
        ) : null}
      </svg>

      {hover ? (
        <div
          ref={tipRef}
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-white shadow-lg"
          style={{
            left: `${(hover.x / CHART.width) * 100}%`,
            top: Math.max(8, (hover.y / CHART.height) * 220 - 52),
          }}
        >
          <p className="text-[10px] font-semibold tracking-[0.12em] text-cyan uppercase">
            {hover.date
              ? new Date(`${hover.date}T12:00:00`).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Day'}
          </p>
          <p className="font-display text-[13px] font-bold">{formatCents(hover.cents)}</p>
        </div>
      ) : null}

      {!hasData ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/85 px-4 py-2 text-[12px] font-medium text-muted shadow-sm backdrop-blur-sm">
            No paid orders in the last 30 days yet
          </p>
        </div>
      ) : null}

      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted">
        <span>30 days ago</span>
        <span>Peak {formatCents(geometry.peak)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/admin/orders/stats')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingBlock label="Loading dashboard" />
  if (error) return <ErrorBlock message={error} onRetry={load} />

  const { stats = {}, revenueSeries = [], recentOrders = [] } = data || {}

  return (
    <>
      <PageHeading
        title="Overview"
        subtitle="Revenue, fulfilment and account activity at a glance."
        actions={
          <Button as={Link} to="/admin/orders" variant="dark">
            Manage orders
          </Button>
        }
      />

      <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCents(stats.revenueCents)}
          hint={`${stats.paidOrders || 0} paid orders`}
          icon={DollarSign}
          tone="cyan"
        />
        <StatCard
          label="Last 30 days"
          value={formatCents(stats.revenue30dCents)}
          hint={`${stats.orders30d || 0} orders`}
          icon={TrendingUp}
          tone="navy"
        />
        <StatCard
          label="Awaiting fulfilment"
          value={stats.awaitingFulfilment ?? 0}
          hint="Pending or processing"
          icon={Package}
          tone={stats.awaitingFulfilment ? 'warn' : 'default'}
        />
        <StatCard
          label="Customers"
          value={stats.customers ?? 0}
          hint={`${stats.pendingUsers || 0} awaiting approval`}
          icon={Users}
        />
      </Reveal>

      {stats.pendingUsers > 0 || stats.lowStock > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {stats.pendingUsers > 0 ? (
            <Link
              to="/admin/customers?status=PENDING"
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition hover:border-amber-300"
            >
              <UserCheck className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-[13px] text-amber-800">
                <span className="font-semibold">{stats.pendingUsers}</span> registration
                {stats.pendingUsers === 1 ? '' : 's'} waiting for approval
              </p>
            </Link>
          ) : null}
          {stats.lowStock > 0 ? (
            <Link
              to="/admin/products"
              className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 transition hover:border-rose-300"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <p className="text-[13px] text-rose-800">
                <span className="font-semibold">{stats.lowStock}</span> variant
                {stats.lowStock === 1 ? '' : 's'} low on stock
              </p>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Revenue, last 30 days</h2>
          {revenueSeries.length ? (
            <RevenueChart series={revenueSeries} />
          ) : (
            <p className="py-10 text-center text-[13px] text-muted">
              No paid orders in the last 30 days yet.
            </p>
          )}
        </Card>

        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <h2 className="font-display text-[15px] font-bold text-ink">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-[12px] font-semibold text-cyan-dim transition hover:text-ink"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No orders yet" message="New orders will appear here instantly." />
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-fog/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-[12px] text-muted">
                        {order.contactName} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                    <p className="text-[13px] font-semibold text-ink">
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
