import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Search,
  Trash2,
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  Input,
  LoadingBlock,
  Modal,
  PageHeading,
  Reveal,
  Select,
  StatCard,
  formatDate,
} from '../ui'

function StatusSwitch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
        checked ? 'bg-cyan' : 'bg-black/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="border-b border-black/5 py-3 last:border-0">
      <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{label}</p>
      <div className="mt-1 text-[13px] leading-relaxed text-ink">{children}</div>
    </div>
  )
}

export default function AdminCustomers() {
  const [params, setParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(params.get('search') || '')
  const [busyId, setBusyId] = useState(null)
  const [manageUser, setManageUser] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [exporting, setExporting] = useState(false)

  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const patchLocal = (id, patch) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        users: prev.users.map((user) => (user.id === id ? { ...user, ...patch } : user)),
      }
    })
    setManageUser((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(null)

    const query = new URLSearchParams()
    if (params.get('search')) query.set('search', params.get('search'))
    if (status) query.set('status', status)
    query.set('page', String(page))

    api
      .get(`/api/admin/users?${query.toString()}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params, status, page])

  useEffect(load, [load])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const query = new URLSearchParams()
      if (params.get('search')) query.set('search', params.get('search'))
      if (status) query.set('status', status)

      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const response = await fetch(
        `${base}/api/admin/users/export${query.toString() ? `?${query}` : ''}`,
        { credentials: 'include' },
      )
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not export member emails.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `peptide-ops-members-${stamp}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('CSV downloaded — ready for Mailchimp or similar tools.', {
        title: 'Export ready',
      })
    } catch (err) {
      toast.error(err.message || 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const changeStatus = async (customer, nextStatus) => {
    const previous = customer.status
    setBusyId(customer.id)
    patchLocal(customer.id, { status: nextStatus })

    try {
      await api.patch(`/api/admin/users/${customer.id}/status`, { status: nextStatus })
      toast.success(
        nextStatus === 'ACTIVE' && previous === 'PENDING'
          ? `${customer.name} approved and notified by email.`
          : nextStatus === 'ACTIVE'
            ? `${customer.name} is active.`
            : `${customer.name} is blocked.`,
        { title: 'Updated' },
      )
      const refresh = new URLSearchParams({ page: String(page) })
      if (status) refresh.set('status', status)
      if (params.get('search')) refresh.set('search', params.get('search'))
      api
        .get(`/api/admin/users?${refresh}`)
        .then((fresh) => {
          setData((prev) =>
            prev
              ? { ...prev, stats: fresh.stats, total: fresh.total, pages: fresh.pages }
              : fresh,
          )
        })
        .catch(() => {})
    } catch (err) {
      patchLocal(customer.id, { status: previous })
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    const customer = pendingDelete
    setPendingDelete(null)
    setManageUser(null)
    try {
      await api.delete(`/api/admin/users/${customer.id}`)
      toast.success(`${customer.name} deleted.`)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          users: prev.users.filter((user) => user.id !== customer.id),
          total: Math.max(0, prev.total - 1),
        }
      })
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const customers = data?.users || []
  const stats = data?.stats || {}

  return (
    <>
      <PageHeading
        title="Customers"
        subtitle={data ? `${data.total} account${data.total === 1 ? '' : 's'}` : 'Loading…'}
        actions={
          <Button type="button" variant="outline" disabled={exporting} onClick={exportCsv}>
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export emails (CSV)'}
          </Button>
        }
      />

      <Reveal className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting approval" value={stats.pending ?? 0} tone="warn" />
        <StatCard label="Active" value={stats.active ?? 0} tone="cyan" />
        <StatCard label="Blocked" value={stats.blocked ?? 0} />
      </Reveal>

      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setParam('search', search.trim())
            }}
            className="relative min-w-[200px] flex-1"
          >
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or company"
              className="pl-9"
            />
          </form>
          <Select
            value={status}
            onChange={(event) => setParam('status', event.target.value)}
            className="w-full sm:w-44"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading customers" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" message="Try clearing the filters." />
      ) : (
        <Reveal stagger={0.03}>
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-black/5">
              {customers.map((customer) => {
                const isSelf = customer.id === currentUser?.id
                const isActive = customer.status === 'ACTIVE'
                const isPending = customer.status === 'PENDING'

                return (
                  <li key={customer.id} className="px-5 py-4 transition hover:bg-fog/40">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {customer.name}
                          {isSelf ? (
                            <span className="ml-2 text-[11px] font-medium text-muted">(You)</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-muted">{customer.email}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isPending && !isSelf ? (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busyId === customer.id}
                            onClick={() => changeStatus(customer, 'ACTIVE')}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                        ) : !isSelf && !isPending ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-semibold ${
                                isActive ? 'text-cyan-dim' : 'text-muted'
                              }`}
                            >
                              {isActive ? 'Active' : 'Blocked'}
                            </span>
                            <StatusSwitch
                              checked={isActive}
                              disabled={busyId === customer.id}
                              label={isActive ? 'Block account' : 'Activate account'}
                              onChange={(on) =>
                                changeStatus(customer, on ? 'ACTIVE' : 'BLOCKED')
                              }
                            />
                          </div>
                        ) : null}

                        <Button size="sm" variant="outline" onClick={() => setManageUser(customer)}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
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

      <Modal
        open={Boolean(manageUser)}
        onClose={() => setManageUser(null)}
        title="Customer details"
        size="md"
        footer={
          manageUser && manageUser.id !== currentUser?.id ? (
            <>
              <Button
                variant="ghost"
                className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => {
                  setPendingDelete(manageUser)
                  setManageUser(null)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" onClick={() => setManageUser(null)}>
                Done
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setManageUser(null)}>
              Close
            </Button>
          )
        }
      >
        {manageUser ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{manageUser.status}</Badge>
              {manageUser.role === 'ADMIN' ? <Badge>ADMIN</Badge> : null}
              {manageUser.id === currentUser?.id ? <Badge tone="USER">You</Badge> : null}
            </div>

            <div className="rounded-2xl border border-black/6 px-4">
              <DetailRow label="Company / Institution">
                {manageUser.company || manageUser.name || '—'}
              </DetailRow>
              <DetailRow label="Institutional email">{manageUser.email}</DetailRow>
              <DetailRow label="Phone">{manageUser.phone || 'Not provided'}</DetailRow>
              <DetailRow label="Intended evaluation framework">
                {manageUser.researchFramework ? (
                  <p className="whitespace-pre-wrap">{manageUser.researchFramework}</p>
                ) : (
                  'Not provided'
                )}
              </DetailRow>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-fog px-4 py-3">
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                  Joined
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink">
                  {formatDate(manageUser.createdAt, true)}
                </p>
              </div>
              <div className="rounded-2xl bg-fog px-4 py-3">
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                  Last seen
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink">
                  {manageUser.lastLoginAt
                    ? formatDate(manageUser.lastLoginAt, true)
                    : 'Never'}
                </p>
              </div>
            </div>

            <Link
              to={`/admin/orders?userId=${manageUser.id}`}
              onClick={() => setManageUser(null)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-cyan/30 bg-cyan/5 px-4 py-3.5 transition hover:border-cyan hover:bg-cyan/10"
            >
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  {manageUser.orderCount} order{manageUser.orderCount === 1 ? '' : 's'}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">View this customer’s order list</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-cyan-dim" />
            </Link>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete customer"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete account
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted">
          Delete <span className="font-semibold text-ink">{pendingDelete?.name}</span>? Their portal
          access is revoked immediately. Past orders are kept for your records.
        </p>
      </Modal>
    </>
  )
}
