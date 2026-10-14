import { useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  KeyRound,
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
} from '../ui'

const EMPTY_PRODUCT = {
  catNo: '',
  name: '',
  strength: '',
  vialSize: '',
  price: '',
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

  // Category form
  const [newCategory, setNewCategory] = useState('')
  const [catBusy, setCatBusy] = useState(false)

  // Product modal
  const [productModal, setProductModal] = useState(null) // { mode, product }
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [productBusy, setProductBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.get('/api/wholesale/admin')
      const list = result.categories || []
      setCategories(list)
      setActiveId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id || ''))
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

  const renameCategory = async (category) => {
    const name = window.prompt('Rename category', category.name)
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === category.name) return
    try {
      await api.patch(`/api/wholesale/admin/categories/${category.id}`, { name: trimmed })
      toast.success('Category renamed.')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not rename the category.')
    }
  }

  const deleteCategory = async (category) => {
    const count = (category.products || []).length
    const ok = window.confirm(
      `Delete "${category.name}"${count ? ` and its ${count} product(s)` : ''}? This cannot be undone.`,
    )
    if (!ok) return
    try {
      await api.delete(`/api/wholesale/admin/categories/${category.id}`)
      toast.success('Category deleted.')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the category.')
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
      name: product.name || '',
      strength: product.strength || '',
      vialSize: product.vialSize || '',
      price: product.price != null ? String(product.price) : '',
    })
    setProductModal({ mode: 'edit', product })
  }

  const saveProduct = async () => {
    if (productBusy) return
    const payload = {
      catNo: productForm.catNo.trim(),
      name: productForm.name.trim(),
      strength: productForm.strength.trim(),
      vialSize: productForm.vialSize.trim(),
      price: Number(productForm.price) || 0,
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
        subtitle="Manage the private wholesale price list, its categories and access password."
        actions={
          <Button as="a" href="/other" target="_blank" rel="noreferrer" variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Open secret page
          </Button>
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
                  onClick={() => renameCategory(category)}
                  className="text-muted transition hover:text-ink"
                  aria-label={`Rename ${category.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(category)}
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
        </div>
      </Modal>
    </div>
  )
}
