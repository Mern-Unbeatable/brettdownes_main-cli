import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Megaphone,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { api, ApiError, formatPrice } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  Field,
  Input,
  LoadingBlock,
  Modal,
  PageHeading,
  PasswordInput,
  Reveal,
  Select,
  Textarea,
} from '../ui'

const EMPTY_PRODUCT = {
  catNo: '',
  barcode: '',
  name: '',
  strength: '',
  vialSize: '',
  price: '',
  stock: '0',
}

export default function AdminWholesale() {
  const toast = useToast()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState('')

  // Password form
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  // Storefront config (note / telegram)
  const [config, setConfig] = useState({ note: '', telegramUrl: '' })
  const [configBusy, setConfigBusy] = useState(false)

  // Category form
  const [newCategory, setNewCategory] = useState('')
  const [catBusy, setCatBusy] = useState(false)

  // Category edit modal
  const [categoryModal, setCategoryModal] = useState(null) // { category, confirmDelete }
  const [categoryName, setCategoryName] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)

  // Product modal
  const [productModal, setProductModal] = useState(null) // { mode, product }
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [productBusy, setProductBusy] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.get('/api/wholesale/admin')
      const list = result.categories || []
      setCategories(list)
      setActiveId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id || ''))
      if (result.config) {
        setConfig({
          note: result.config.note || '',
          telegramUrl: result.config.telegramUrl || '',
        })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the wholesale catalog.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = useMemo(
    () => categories.find((category) => category.id === activeId) || categories[0],
    [categories, activeId],
  )

  /* ---- Password ---- */
  const submitPassword = async (event) => {
    event.preventDefault()
    if (pwBusy) return
    if (pwNew.trim().length < 4) {
      toast.error('New password must be at least 4 characters.')
      return
    }
    if (pwNew !== pwConfirm) {
      toast.error('New password and confirmation do not match.')
      return
    }
    setPwBusy(true)
    try {
      await api.patch('/api/wholesale/admin/password', {
        ...(pwCurrent.trim() ? { currentPassword: pwCurrent.trim() } : {}),
        newPassword: pwNew.trim(),
      })
      toast.success('Access password updated.', { title: 'Saved' })
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update the password.')
    } finally {
      setPwBusy(false)
    }
  }

  /* ---- Storefront config ---- */
  const saveConfig = async (event) => {
    event.preventDefault()
    if (configBusy) return
    setConfigBusy(true)
    try {
      await api.patch('/api/wholesale/admin/config', {
        note: config.note,
        telegramUrl: config.telegramUrl.trim(),
      })
      toast.success('Storefront settings saved.', { title: 'Saved' })
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save settings.')
    } finally {
      setConfigBusy(false)
    }
  }

  /* ---- Categories ---- */
  const addCategory = async (event) => {
    event.preventDefault()
    if (catBusy) return
    const name = newCategory.trim()
    if (!name) {
      toast.error('Enter a category name.')
      return
    }
    setCatBusy(true)
    try {
      const result = await api.post('/api/wholesale/admin/categories', { name })
      toast.success(`Added category "${name}".`, { title: 'Category created' })
      setNewCategory('')
      await load()
      if (result.category?.id) setActiveId(result.category.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not add the category.')
    } finally {
      setCatBusy(false)
    }
  }

  const openEditCategory = (category, confirmDelete = false) => {
    setCategoryName(category.name)
    setCategoryModal({ category, confirmDelete })
  }

  const saveCategoryName = async () => {
    if (categoryBusy || !categoryModal) return
    const trimmed = categoryName.trim()
    if (!trimmed) {
      toast.error('Enter a category name.')
      return
    }
    if (trimmed === categoryModal.category.name) {
      setCategoryModal(null)
      return
    }
    setCategoryBusy(true)
    try {
      await api.patch(`/api/wholesale/admin/categories/${categoryModal.category.id}`, {
        name: trimmed,
      })
      toast.success('Category renamed.', { title: 'Saved' })
      setCategoryModal(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not rename the category.')
    } finally {
      setCategoryBusy(false)
    }
  }

  const confirmDeleteCategory = async () => {
    if (categoryBusy || !categoryModal) return
    setCategoryBusy(true)
    try {
      await api.delete(`/api/wholesale/admin/categories/${categoryModal.category.id}`)
      toast.success('Category deleted.')
      setCategoryModal(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the category.')
    } finally {
      setCategoryBusy(false)
    }
  }

  /* ---- Products ---- */
  const openCreateProduct = () => {
    if (!active) {
      toast.error('Create a category first.')
      return
    }
    setProductForm(EMPTY_PRODUCT)
    setProductModal({ mode: 'create' })
  }

  const openEditProduct = (product) => {
    setProductForm({
      catNo: product.catNo || '',
      barcode: product.barcode || '',
      name: product.name || '',
      strength: product.strength || '',
      vialSize: product.vialSize || '',
      price: product.price != null ? String(product.price) : '',
      stock: String(product.stock ?? 0),
    })
    setProductModal({ mode: 'edit', product })
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const result = await api.upload('/api/wholesale/admin/import', file)
      const { summary } = result
      const notFound = summary.notFound || []

      if (summary.variantsUpdated > 0) {
        toast.success(
          `${summary.variantsUpdated} item${summary.variantsUpdated === 1 ? '' : 's'} updated.`,
          { title: 'Inventory updated' },
        )
      }

      if (notFound.length) {
        const preview = notFound
          .slice(0, 8)
          .map((entry) => entry.barcode)
          .join(', ')
        const extra = notFound.length > 8 ? ` (+${notFound.length - 8} more)` : ''
        toast.warning(
          `These barcodes were not found: ${preview}${extra}. Export inventory from Secret page, edit Quantity, then import again.`,
          { title: 'Barcode not found', duration: 14000 },
        )
      }

      const rowErrors = summary.rowErrors || []
      if (rowErrors.length) {
        toast.warning(rowErrors.slice(0, 3).join(' '), {
          title: 'Some rows skipped',
          duration: 10000,
        })
      } else if (!notFound.length && summary.variantsUpdated === 0) {
        toast.info('No rows to update in that file.', { title: 'Import complete' })
      }

      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const exportInventory = async () => {
    setExporting(true)
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const response = await fetch(`${base}/api/wholesale/admin/import/export`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not export inventory.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'peptide-ops-other-inventory.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Inventory spreadsheet downloaded.', { title: 'Export ready' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  const saveProduct = async () => {
    if (productBusy) return
    const payload = {
      catNo: productForm.catNo.trim(),
      barcode: productForm.barcode.trim(),
      name: productForm.name.trim(),
      strength: productForm.strength.trim(),
      vialSize: productForm.vialSize.trim(),
      price: Number(productForm.price) || 0,
      stock: Math.max(0, Math.trunc(Number(productForm.stock) || 0)),
    }
    if (!payload.name && !payload.catNo) {
      toast.error('Add at least a cat. no or a name.')
      return
    }
    setProductBusy(true)
    try {
      if (productModal.mode === 'create') {
        await api.post('/api/wholesale/admin/products', { categoryId: active.id, ...payload })
        toast.success('Product added.', { title: 'Saved' })
      } else {
        const categoryId = productModal.product?.categoryId
        await api.patch(`/api/wholesale/admin/products/${productModal.product.id}`, {
          ...payload,
          ...(categoryId ? { categoryId } : {}),
        })
        toast.success('Product updated.', { title: 'Saved' })
      }
      setProductModal(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the product.')
    } finally {
      setProductBusy(false)
    }
  }

  const deleteProduct = async (product) => {
    const ok = window.confirm(`Delete "${product.name || product.catNo || 'this product'}"?`)
    if (!ok) return
    try {
      await api.delete(`/api/wholesale/admin/products/${product.id}`)
      toast.success('Product deleted.')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the product.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="Secret page"
        subtitle="Manage the private price list, stock, categories and access password."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={exportInventory}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import Excel'}
            </Button>
            <Button as="a" href="/other" target="_blank" rel="noreferrer" variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              Open secret page
            </Button>
          </div>
        }
      />

      {/* Access password */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-cyan">
            <KeyRound className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">Access password</h2>
            <p className="text-[12px] text-muted">
              This is the password visitors enter to view the price list at /other.
            </p>
          </div>
        </div>
        <form onSubmit={submitPassword} className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password (optional)">
            <PasswordInput
              value={pwCurrent}
              onChange={(event) => setPwCurrent(event.target.value)}
              placeholder="Leave blank to skip"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              value={pwNew}
              onChange={(event) => setPwNew(event.target.value)}
              placeholder="New access password"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              value={pwConfirm}
              onChange={(event) => setPwConfirm(event.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={pwBusy}>
              {pwBusy ? 'Updating…' : 'Update access password'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Storefront settings */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-cyan">
            <Megaphone className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">Storefront settings</h2>
            <p className="text-[12px] text-muted">
              Note banner and Telegram link on /other. Shipping rates come from USPS / UPS / FedEx at
              checkout (same as the main shop).
            </p>
          </div>
        </div>

        <form onSubmit={saveConfig} className="space-y-4">
          <Field label="Note banner" hint="Shown at the top of the price list.">
            <Textarea
              rows={3}
              value={config.note}
              onChange={(event) => setConfig((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="e.g. These are specialized items and aren't always in stock…"
            />
          </Field>

          <Field label="Telegram link" hint="Optional. Leave blank to hide the Telegram button.">
            <Input
              value={config.telegramUrl}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, telegramUrl: event.target.value }))
              }
              placeholder="https://t.me/yourchannel"
            />
          </Field>

          <Button type="submit" disabled={configBusy}>
            {configBusy ? 'Saving…' : 'Save storefront settings'}
          </Button>
        </form>
      </Card>

      {/* Categories */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-cyan">
            <Tag className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">Categories</h2>
            <p className="text-[12px] text-muted">Tabs shown on the price list, e.g. Oil and Tablets.</p>
          </div>
        </div>

        {categories.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-xl border border-black/8 bg-fog px-3 py-2"
              >
                <span className="text-[13px] font-semibold text-ink">{category.name}</span>
                <Badge tone="USER">{(category.products || []).length}</Badge>
                <button
                  type="button"
                  onClick={() => openEditCategory(category)}
                  className="text-muted transition hover:text-ink"
                  aria-label={`Rename ${category.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditCategory(category, true)}
                  className="text-muted transition hover:text-rose-600"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3">
          <Field label="New category" className="flex-1 min-w-[200px]">
            <Input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="e.g. Peptides"
            />
          </Field>
          <Button type="submit" variant="dark" disabled={catBusy}>
            <Plus className="h-4 w-4" />
            {catBusy ? 'Adding…' : 'Add category'}
          </Button>
        </form>
      </Card>

      {/* Products */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-5 py-4 md:px-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveId(category.id)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  active?.id === category.id
                    ? 'bg-cyan text-navy'
                    : 'bg-fog text-muted hover:text-ink'
                }`}
              >
                {category.name} ({(category.products || []).length})
              </button>
            ))}
          </div>
          <Button size="sm" onClick={openCreateProduct}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>

        {loading ? (
          <LoadingBlock label="Loading catalog" />
        ) : error ? (
          <div className="p-5">
            <ErrorBlock message={error} onRetry={load} />
          </div>
        ) : !active ? (
          <div className="p-5">
            <EmptyState
              title="No categories yet"
              message="Add a category above to start building the price list."
            />
          </div>
        ) : (active.products || []).length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No products in this category"
              message="Use “Add product” to create the first row."
              action={
                <Button size="sm" onClick={openCreateProduct}>
                  <Plus className="h-4 w-4" />
                  Add product
                </Button>
              }
            />
          </div>
        ) : (
          <Reveal className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="bg-fog text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                  <th className="px-4 py-3">Cat. No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Strength</th>
                  <th className="px-4 py-3">Vial Size</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6 text-[13px]">
                {(active.products || []).map((product) => (
                  <tr key={product.id} className="transition hover:bg-fog/60">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-cyan-dim">
                      {product.catNo || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{product.name || '—'}</td>
                    <td className="px-4 py-3 text-muted">{product.strength || '—'}</td>
                    <td className="px-4 py-3 text-muted">{product.vialSize || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-8 justify-center rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                          (product.stock || 0) > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-fog text-muted transition hover:text-ink"
                          aria-label="Edit product"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-fog text-muted transition hover:text-rose-600"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}
      </Card>

      <Modal
        open={Boolean(productModal)}
        onClose={() => (productBusy ? null : setProductModal(null))}
        title={productModal?.mode === 'edit' ? 'Edit product' : 'Add product'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setProductModal(null)} disabled={productBusy}>
              Cancel
            </Button>
            <Button onClick={saveProduct} disabled={productBusy}>
              {productBusy ? 'Saving…' : 'Save product'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {productModal?.mode === 'edit' ? (
            <Field label="Category" className="sm:col-span-2">
              <Select
                value={productModal.product?.categoryId || active?.id || ''}
                onChange={(event) =>
                  setProductModal((prev) => ({
                    ...prev,
                    product: { ...prev.product, categoryId: event.target.value },
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Category" className="sm:col-span-2">
              <Input value={active?.name || ''} disabled />
            </Field>
          )}
          <Field label="Cat. No">
            <Input
              value={productForm.catNo}
              onChange={(event) => setProductForm((f) => ({ ...f, catNo: event.target.value }))}
              placeholder="e.g. C250"
            />
          </Field>
          <Field
            label="Item barcode"
            hint="Optional. Same as main shop Excel. Leave blank to match by cat. no."
          >
            <Input
              value={productForm.barcode}
              onChange={(event) => setProductForm((f) => ({ ...f, barcode: event.target.value }))}
              placeholder="Matches inventory software"
            />
          </Field>
          <Field label="Price (USD)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(event) => setProductForm((f) => ({ ...f, price: event.target.value }))}
              placeholder="0.00"
            />
          </Field>
          <Field label="Name" className="sm:col-span-2">
            <Input
              value={productForm.name}
              onChange={(event) => setProductForm((f) => ({ ...f, name: event.target.value }))}
              placeholder="Product name"
            />
          </Field>
          <Field label="Strength">
            <Input
              value={productForm.strength}
              onChange={(event) => setProductForm((f) => ({ ...f, strength: event.target.value }))}
              placeholder="e.g. 250mg"
            />
          </Field>
          <Field label="Vial size / packaging">
            <Input
              value={productForm.vialSize}
              onChange={(event) => setProductForm((f) => ({ ...f, vialSize: event.target.value }))}
              placeholder="e.g. 10ml or 100 tablets/bottle"
            />
          </Field>
          <Field
            label="Stock quantity"
            hint="Customers cannot order more than this. 0 = out of stock."
          >
            <Input
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={(event) => setProductForm((f) => ({ ...f, stock: event.target.value }))}
              placeholder="0"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(categoryModal)}
        onClose={() => (categoryBusy ? null : setCategoryModal(null))}
        title={categoryModal?.confirmDelete ? 'Delete category' : 'Edit category'}
        size="sm"
        footer={
          categoryModal?.confirmDelete ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setCategoryModal((prev) => ({ ...prev, confirmDelete: false }))}
                disabled={categoryBusy}
              >
                Back
              </Button>
              <Button variant="danger" onClick={confirmDeleteCategory} disabled={categoryBusy}>
                <Trash2 className="h-4 w-4" />
                {categoryBusy ? 'Deleting…' : 'Delete category'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setCategoryModal(null)} disabled={categoryBusy}>
                Cancel
              </Button>
              <Button onClick={saveCategoryName} disabled={categoryBusy}>
                {categoryBusy ? 'Saving…' : 'Save'}
              </Button>
            </>
          )
        }
      >
        {categoryModal?.confirmDelete ? (
          <div className="space-y-2">
            <p className="text-[14px] text-ink">
              Delete <strong>{categoryModal.category.name}</strong>
              {(categoryModal.category.products || []).length
                ? ` and its ${(categoryModal.category.products || []).length} product(s)`
                : ''}
              ?
            </p>
            <p className="text-[13px] text-muted">This cannot be undone.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Category name">
              <Input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveCategoryName()
                }}
                placeholder="e.g. Oils"
                autoFocus
              />
            </Field>
            <button
              type="button"
              onClick={() => setCategoryModal((prev) => ({ ...prev, confirmDelete: true }))}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 transition hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete this category
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
