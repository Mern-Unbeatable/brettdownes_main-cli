import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, Eye, Loader2, Mail, Search, User } from 'lucide-react'
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
  formatDate,
} from '../ui'

function Fact({ icon: Icon, label, value, accent = false }) {
  return (
    <div className={`min-w-0 px-4 py-3 ${accent ? 'bg-cyan/10' : 'bg-white'}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-ink" title={value || ''}>
        {value || '—'}
      </p>
    </div>
  )
}

const FILTERS = [
  { id: 'PENDING', label: 'Waiting' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: '', label: 'All' },
]

export default function AdminReviews() {
  const toast = useToast()
  const [status, setStatus] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [reasons, setReasons] = useState({})

  const load = () => {
    setError(null)
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    if (query) params.set('search', query)
    api
      .get(`/api/admin/reviews?${params.toString()}`)
      .then((result) => {
        setData(result)
        window.dispatchEvent(
          new CustomEvent('peptide:review-pending', { detail: { pending: Number(result.pending) || 0 } }),
        )
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, page])

  const approve = async (claim) => {
    setBusyId(claim.id)
    try {
      await api.post(`/api/admin/reviews/${claim.id}/approve`)
      toast.success(`${formatCents(data?.rewardCents || 500)} added to ${claim.user?.email}.`, {
        title: 'Credit added',
      })
      load()
    } catch (err) {
      toast.error(err.message || 'Could not approve.')
    } finally {
      setBusyId('')
    }
  }

  const reject = async (claim) => {
    setBusyId(claim.id)
    try {
      await api.post(`/api/admin/reviews/${claim.id}/reject`, {
        reason: reasons[claim.id] || '',
      })
      toast.success('Request rejected.', { title: 'Updated' })
      load()
    } catch (err) {
      toast.error(err.message || 'Could not reject.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <PageHeading
        title="Review credit"
        actions={
          data?.trustpilotUrl ? (
            <a
              href={data.trustpilotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-fog"
            >
              Trustpilot
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id || 'all'}
              type="button"
              onClick={() => {
                setStatus(filter.id)
                setPage(1)
              }}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                status === filter.id ? 'bg-ink text-white' : 'bg-fog text-ink hover:bg-fog-deep'
              }`}
            >
              {filter.label}
              {filter.id === 'PENDING' && data?.pending ? ` ${data.pending}` : ''}
            </button>
          ))}
        </div>
        <form
          className="relative min-w-0 flex-1"
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
            placeholder="Search order, customer, or review email"
            className="pl-9"
          />
        </form>
      </div>

      {loading ? (
        <LoadingBlock label="Loading review requests" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : !data?.claims?.length ? (
        <EmptyState
          title="No review requests"
          message="Verified customer claims will show up here. Approve one to add $5 account credit."
        />
      ) : (
        <div className="grid gap-4">
          {data.claims.map((claim) => (
            <Card key={claim.id} padded={false} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">Order</p>
                  <p className="mt-1 font-display text-[18px] font-bold tracking-tight text-ink">
                    {claim.orderNumber}
                  </p>
                </div>
                <Badge
                  tone={
                    claim.status === 'APPROVED' ? 'ACTIVE' : claim.status === 'REJECTED' ? 'BLOCKED' : 'PENDING'
                  }
                >
                  {claim.status === 'PENDING' ? 'Waiting' : claim.status}
                </Badge>
              </div>

              <div className="grid border-y border-black/6 sm:grid-cols-2 xl:grid-cols-4">
                <Fact icon={User} label="Customer" value={claim.user?.name} />
                <Fact icon={Mail} label="Account email" value={claim.user?.email} />
                <Fact icon={Mail} label="Trustpilot email" value={claim.reviewEmail} accent />
                <Fact icon={Calendar} label="Submitted" value={formatDate(claim.createdAt)} />
              </div>

              {claim.rejectReason && claim.status === 'REJECTED' ? (
                <p className="px-5 pt-4 text-[13px] text-rose-600">{claim.rejectReason}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 px-5 py-4">
                <Link
                  to={`/admin/orders/${claim.orderId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan/15 px-4 py-2.5 text-[13px] font-semibold text-cyan-dim transition hover:bg-cyan/25 hover:text-navy"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  Open order
                </Link>
                {claim.status === 'PENDING' ? (
                  <>
                    <Button type="button" disabled={busyId === claim.id} onClick={() => approve(claim)}>
                      {busyId === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Approve {formatCents(data.rewardCents || 500)}
                    </Button>
                    <Input
                      value={reasons[claim.id] || ''}
                      onChange={(event) =>
                        setReasons((prev) => ({ ...prev, [claim.id]: event.target.value }))
                      }
                      placeholder="Reject reason (optional)"
                      className="min-w-[220px] flex-1"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busyId === claim.id}
                      onClick={() => reject(claim)}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
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
