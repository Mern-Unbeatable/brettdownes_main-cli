import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search, Star } from 'lucide-react'
import { api, formatCents } from '../../../lib/api'
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
  formatDate,
} from '../ui'

const STATUS_LABEL = {
  AWAITING_OTP: 'Code sent',
  PENDING: 'Waiting for approval',
  APPROVED: 'Credit added',
  REJECTED: 'Not approved',
}

function OrderClaim({ order, rewardCents, onChanged, highlighted = false }) {
  const toast = useToast()
  const claim = order.claim
  const approved = claim?.status === 'APPROVED'
  const waiting = claim?.status === 'PENDING'
  const locked = approved || waiting
  const [email, setEmail] = useState(approved || waiting ? '' : claim?.reviewEmail || '')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState('')

  const sendCode = async (event) => {
    event.preventDefault()
    setBusy('otp')
    try {
      await api.post('/api/reviews/otp', { orderId: order.id, reviewEmail: email.trim() })
      toast.success('Enter the 6-digit code from that inbox.', { title: 'Code sent' })
      onChanged()
    } catch (error) {
      toast.error(error.message || 'Could not send the code.')
    } finally {
      setBusy('')
    }
  }

  const verify = async (event) => {
    event.preventDefault()
    setBusy('verify')
    try {
      await api.post('/api/reviews/verify', { orderId: order.id, otp: otp.trim() })
      toast.success('Submitted. We will check Trustpilot and add $5 credit if the review is approved.', {
        title: 'Sent for review',
      })
      setOtp('')
      onChanged()
    } catch (error) {
      toast.error(error.message || 'Could not verify the code.')
    } finally {
      setBusy('')
    }
  }

  return (
    <Card className={`flex flex-col gap-4 ${highlighted ? 'ring-2 ring-cyan' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[16px] font-bold text-ink">{order.orderNumber}</p>
          <p className="mt-1 text-[12px] text-muted">
            Delivered {formatDate(order.deliveredAt)} · {formatCents(order.totalCents)}
          </p>
        </div>
        {claim ? (
          <Badge tone={claim.status === 'APPROVED' ? 'ACTIVE' : claim.status === 'REJECTED' ? 'BLOCKED' : 'PENDING'}>
            {STATUS_LABEL[claim.status] || claim.status}
          </Badge>
        ) : (
          <Badge tone="PENDING">{formatCents(rewardCents)} available</Badge>
        )}
      </div>

      {approved ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] leading-relaxed text-emerald-800">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            {formatCents(claim.creditCents)} was added to your account credit.
          </p>
          <p className="mt-1">This order is verified. You can’t submit another review for it.</p>
        </div>
      ) : null}

      {waiting ? (
        <p className="text-[13px] leading-relaxed text-muted">
          Already submitted from <span className="font-semibold text-ink">{claim.reviewEmail}</span>.
          You can’t send this order again while staff checks Trustpilot.
        </p>
      ) : null}

      {claim?.status === 'REJECTED' ? (
        <p className="text-[13px] leading-relaxed text-rose-600">
          {claim.rejectReason || 'This request was not approved.'} You can submit again with the
          email on the review.
        </p>
      ) : null}

      {!locked ? (
        <form onSubmit={sendCode} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
              Email used on Trustpilot
            </span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <Button type="submit" disabled={busy === 'otp'}>
            {busy === 'otp' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {claim?.status === 'AWAITING_OTP' ? 'Resend code' : 'Send code'}
          </Button>
        </form>
      ) : null}

      {claim?.status === 'AWAITING_OTP' ? (
        <form onSubmit={verify} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
              6-digit code
            </span>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
            />
          </label>
          <Button type="submit" variant="dark" disabled={busy === 'verify'}>
            {busy === 'verify' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for review
          </Button>
        </form>
      ) : null}
    </Card>
  )
}

export default function UserReviews() {
  const [params] = useSearchParams()
  const focusOrderId = params.get('order') || ''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    setError(null)
    const params = new URLSearchParams({ page: String(page) })
    if (query) params.set('search', query)
    if (focusOrderId) params.set('orderId', focusOrderId)
    api
      .get(`/api/reviews/mine?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, focusOrderId])

  const orders = data?.orders || []
  const focused = orders.find((order) => order.id === focusOrderId)
  const focusStatus = focused?.claim?.status
  const subtitle =
    focusStatus === 'APPROVED'
      ? 'This order already received the $5 review credit. It can’t be submitted again.'
      : focusStatus === 'PENDING'
        ? 'This review is already submitted and waiting for staff to verify it.'
        : focusOrderId
          ? 'This delivered order is ready for a Trustpilot review and $5 account credit.'
          : 'Delivered orders appear here. One $5 credit per order after we confirm the review.'

  return (
    <>
      <PageHeading
        title="Review credit"
        subtitle={subtitle}
        actions={
          focusOrderId ? (
            <Button as={Link} to="/dashboard/reviews" variant="outline">
              All delivered orders
            </Button>
          ) : null
        }
      />

      <Reveal className="mb-5">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan-dim">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[15px] font-bold text-ink">
                {formatCents(data?.rewardCents || 500)} after a verified Trustpilot review
              </p>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
                Claim review credit here after delivery—delivered-order emails no longer include
                Trustpilot prompts. Leave the review with any email you control, enter that address
                here, and we email a code to verify it. Staff checks Trustpilot and adds credit to
                your account.
              </p>
            </div>
          </div>
          {data?.trustpilotUrl ? (
            <a
              href={data.trustpilotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-navy"
            >
              Open Trustpilot
            </a>
          ) : null}
        </Card>
      </Reveal>

      <form
        className="relative mb-5"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setQuery(search.trim())
        }}
      >
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by order number"
          className="pl-9"
        />
      </form>

      {loading ? (
        <LoadingBlock label="Loading review credit" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No delivered orders yet"
          message="When a paid order is marked delivered, it will show up here so you can claim the review credit."
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderClaim
              key={order.id}
              order={order}
              rewardCents={data.rewardCents}
              highlighted={order.id === focusOrderId}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {data && data.pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
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
            onClick={() => setPage((value) => value + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </>
  )
}
