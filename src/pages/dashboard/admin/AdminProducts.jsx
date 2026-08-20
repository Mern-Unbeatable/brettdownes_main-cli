import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileSpreadsheet, PackagePlus, Pencil, Search, Trash2 } from 'lucide-react'
import { api, assetUrl, formatPrice } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import { useCatalog } from '../../../context/CatalogContext'
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
} from '../ui'
import { PRODUCT_CATEGORIES, normalizeCategory } from '../../../data/categories'

const PAGE_SIZE = 9

export default function AdminProducts() {
  const toast = useToast()
  const { reload: reloadCatalog } = useCatalog()
  const fileRef = useRef(null)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [importing, setImporting] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/products?includeInactive=true')
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    setPage(1)
  }, [search, category])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((product) => {
        if (category !== 'ALL' && normalizeCategory(product.category) !== category) return false
        if (!term) return true
        return (
          product.name.toLowerCase().includes(term) ||
          product.slug.includes(term) ||
          product.variants.some((variant) => variant.dose.toLowerCase().includes(term)) ||
          product.variants.some((variant) =>
            String(variant.barcode || '')
              .toLowerCase()
              .includes(term),
          )
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [products, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const toggleActive = async (product) => {
    const nextActive = !product.isActive
    setBusyId(product.id)
    setProducts((prev) =>
      prev.map((entry) => (entry.id === product.id ? { ...entry, isActive: nextActive } : entry)),
    )
    try {
      await api.patch(`/api/products/${product.id}`, { isActive: nextActive })
      toast.success(`${product.name} is now ${nextActive ? 'live' : 'hidden'}.`)
      reloadCatalog()
    } catch (err) {
      setProducts((prev) =>
        prev.map((entry) =>
          entry.id === product.id ? { ...entry, isActive: product.isActive } : entry,
        ),
      )
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    const product = pendingDelete
    if (!product) return
    setPendingDelete(null)
    try {
      await api.delete(`/api/products/${product.id}`)
      setProducts((prev) => prev.filter((entry) => entry.id !== product.id))
      toast.success(`${product.name} deleted.`)
      reloadCatalog()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const result = await api.upload('/api/products/import', file)
      const { summary } = result
      const notFound = summary.notFound || []

      if (summary.variantsUpdated > 0) {
        toast.success(
          `${summary.variantsUpdated} variant${summary.variantsUpdated === 1 ? '' : 's'} updated.`,
          { title: 'Inventory updated' },
        )
      }

      if (notFound.length) {
        const preview = notFound
          .slice(0, 8)
          .map((entry) => entry.barcode)
          .join(', ')
        const extra = notFound.length > 8 ? ` (+${notFound.length - 8} more)` : ''
        const message =
          summary.variantsUpdated > 0
            ? `These barcodes were not found on the site, so quantity was not updated: ${preview}${extra}. Add the barcode on the product page first.`
            : `No quantities were updated. Barcode not found: ${preview}${extra}. Add each barcode on the product page first, then upload again.`

        toast.warning(message, {
          title: 'Barcode not found',
          duration: 12000,
        })
      } else if (summary.variantsUpdated === 0) {
        toast.info('No rows to update in that file.', { title: 'Import complete' })
      }

      load()
      reloadCatalog()
    } catch (err) {
      toast.error(err.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const response = await fetch(`${base}/api/products/import/template`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not download the inventory template.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'peptide-ops-inventory.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <PageHeading
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? '' : 's'} in the catalogue`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet className="h-4 w-4" />
              Download template
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import Excel'}
            </Button>
            <Button as={Link} to="/admin/products/new" variant="primary">
              <PackagePlus className="h-4 w-4" />
              New product
            </Button>
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, dose or slug"
              className="pl-9"
            />
          </div>
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full sm:w-52"
          >
            <option value="ALL">All categories</option>
            {PRODUCT_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock label="Loading products" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={products.length ? 'No matching products' : 'No products yet'}
          message={
            products.length
              ? 'Adjust your search or category filter.'
              : 'Add a product or import your Main Store spreadsheet.'
          }
          action={
            <Button as={Link} to="/admin/products/new" variant="primary">
              New product
            </Button>
          }
        />
      ) : (
        <>
          <Reveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" stagger={0.04}>
            {pageItems.map((product) => {
              const prices = product.variants.map((variant) => variant.price)
              const quantity = product.variants.reduce((sum, variant) => sum + variant.stock, 0)

              return (
                <Card key={product.id} padded={false} className="overflow-hidden">
                  <div className="flex items-start gap-3 p-4">
                    <img
                      src={assetUrl(product.image)}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl bg-fog object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-display text-[15px] font-bold text-ink">
                          {product.name}
                        </p>
                        <Badge tone={product.isActive ? 'ACTIVE' : 'BLOCKED'}>
                          {product.isActive ? 'Live' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {product.category} · {product.variants.length} variant
                        {product.variants.length === 1 ? '' : 's'}
                      </p>
                      <p className="mt-1.5 text-[13px] font-semibold text-ink">
                        {prices.length
                          ? prices.length > 1
                            ? `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`
                            : formatPrice(prices[0])
                          : 'No pricing'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black/6 bg-fog/50 px-4 py-3">
                    <span
                      className={`text-[12px] font-medium ${quantity <= 5 ? 'text-rose-600' : 'text-muted'}`}
                    >
                      Qty {quantity}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.isActive}
                        aria-label={product.isActive ? 'Hide product' : 'Publish product'}
                        title={product.isActive ? 'Live on storefront' : 'Hidden from storefront'}
                        disabled={busyId === product.id}
                        onClick={() => toggleActive(product)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
                          product.isActive ? 'bg-cyan' : 'bg-black/15'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            product.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <Link
                        to={`/admin/products/${product.id}`}
                        aria-label="Edit product"
                        className="rounded-lg p-2 text-muted transition hover:bg-white hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(product)}
                        aria-label="Delete product"
                        className="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </Reveal>

          {totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-[12px] font-semibold text-ink">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete product?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-muted">
          Remove <span className="font-semibold text-ink">{pendingDelete?.name}</span> and all of its
          variants from the catalogue?
        </p>
      </Modal>
    </>
  )
}
