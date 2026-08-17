import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ImagePlus, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'
import { api, assetUrl } from '../../../lib/api'
import { useToast } from '../../../components/Toaster'
import { useCatalog } from '../../../context/CatalogContext'
import {
  Button,
  Card,
  ErrorBlock,
  Field,
  Input,
  LoadingBlock,
  PageHeading,
  Reveal,
  Textarea,
  Toggle,
} from '../ui'

const EMPTY_VARIANT = {
  dose: '',
  price: '',
  image: '',
  stock: 0,
  weightOz: 2,
  lengthIn: 6,
  widthIn: 4,
  heightIn: 2,
  isActive: true,
}

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  category: 'Peptides',
  summary: '',
  description: '',
  purity: '',
  form: 'Lyophilized',
  image: '',
  highlights: [],
  badge: '',
  showOnHome: false,
  homeOrder: 0,
  isActive: true,
  sortOrder: 0,
}

function ImagePicker({ value, onChange, label = 'Image', square = false }) {
  const inputRef = useRef(null)
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const upload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose a JPG, PNG, WEBP or GIF image.')
      return
    }
    setUploading(true)
    try {
      const data = await api.upload('/api/uploads', file)
      onChange(data.url)
      toast.success('Image uploaded.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className={square ? 'w-full' : undefined}>
      {label ? (
        <span className="mb-1.5 block text-[12px] font-semibold text-ink">{label}</span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!uploading) inputRef.current?.click()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragging(false)
        }}
        onDrop={onDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border transition ${
          square ? 'aspect-square w-full bg-[#f2f2f2]' : 'min-h-[148px] border-dashed'
        } ${
          dragging
            ? 'border-2 border-cyan bg-cyan/10'
            : value
              ? 'border border-black/8'
              : square
                ? 'border border-dashed border-black/15 hover:border-cyan/50 hover:bg-cyan/5'
                : 'border-black/12 bg-fog/70 hover:border-cyan/50 hover:bg-cyan/5'
        }`}
      >
        {value ? (
          <>
            <img
              src={assetUrl(value)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/15 to-transparent" />
            <div className="relative z-10 mt-auto flex w-full items-center justify-between gap-2 p-2.5">
              <span className="rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold text-ink shadow-sm">
                {uploading ? 'Uploading…' : 'Replace'}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onChange('')
                }}
                aria-label="Remove image"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-1.5 px-3 py-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-dim shadow-sm">
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-cyan" />
              ) : (
                <ImagePlus className="h-4 w-4" strokeWidth={1.8} />
              )}
            </span>
            <p className="text-[12px] font-semibold text-ink">
              {uploading ? 'Uploading…' : dragging ? 'Drop here' : 'Upload image'}
            </p>
            <p className="text-[10px] leading-snug text-muted">Drag & drop or click</p>
          </div>
        )}

        {uploading && value ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-navy/35 backdrop-blur-[1px]">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/25 border-t-cyan" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function AdminProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { reload: reloadCatalog } = useCatalog()

  const isNew = !id
  const [product, setProduct] = useState(EMPTY_PRODUCT)
  const [variants, setVariants] = useState([{ ...EMPTY_VARIANT }])
  const [highlightDraft, setHighlightDraft] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    api
      .get(`/api/products/${id}`)
      .then((data) => {
        setProduct({ ...EMPTY_PRODUCT, ...data.product })
        setVariants(data.product.variants.length ? data.product.variants : [{ ...EMPTY_VARIANT }])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const setField = (name, value) => setProduct((prev) => ({ ...prev, [name]: value }))

  const setVariantField = (index, name, value) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [name]: value } : variant)))
  }

  const addHighlight = () => {
    const value = highlightDraft.trim()
    if (!value) return
    setField('highlights', [...(product.highlights || []), value])
    setHighlightDraft('')
  }

  const validate = () => {
    if (!product.name.trim()) return 'Product name is required.'
    if (!variants.length) return 'Add at least one variant.'

    for (const [index, variant] of variants.entries()) {
      if (!variant.dose?.toString().trim()) return `Variant ${index + 1} needs a dose.`
      if (variant.price === '' || Number(variant.price) < 0) {
        return `Variant ${index + 1} needs a valid price.`
      }
      if (variant.stock === '' || Number(variant.stock) < 0) {
        return `Variant ${index + 1} needs a quantity ≥ 0.`
      }
    }

    return null
  }

  const save = async (event) => {
    event.preventDefault()

    const problem = validate()
    if (problem) {
      toast.error(problem)
      return
    }

    const productPayload = {
      name: product.name.trim(),
      category: product.category.trim() || 'Peptides',
      summary: product.summary || '',
      description: product.description || '',
      purity: product.purity || '',
      form: product.form || 'Lyophilized',
      // Prefer an existing product image; otherwise use the first variant image.
      image:
        product.image ||
        variants.find((variant) => variant.image)?.image ||
        '',
      highlights: product.highlights || [],
      badge: product.badge || '',
      showOnHome: product.showOnHome === true,
      homeOrder: Number(product.homeOrder) || 0,
      isActive: product.isActive,
      sortOrder: Number(product.sortOrder) || 0,
    }

    const variantPayload = variants.map((variant, index) => ({
      dose: variant.dose.trim(),
      price: Number(variant.price),
      image: variant.image || '',
      stock: Number(variant.stock) || 0,
      weightOz: Number(variant.weightOz) || 2,
      lengthIn: Number(variant.lengthIn) || 6,
      widthIn: Number(variant.widthIn) || 4,
      heightIn: Number(variant.heightIn) || 2,
      isActive: variant.isActive !== false,
      sortOrder: index,
    }))

    setSaving(true)
    try {
      if (isNew) {
        const data = await api.post('/api/products', {
          ...productPayload,
          variants: variantPayload,
        })
        toast.success('Product created.', { title: 'Saved' })
        reloadCatalog()
        navigate(`/admin/products/${data.product.id}`, { replace: true })
      } else {
        await api.patch(`/api/products/${id}`, productPayload)

        // Variants are reconciled one by one so existing rows keep their id.
        const original = variants.filter((variant) => variant.id).map((variant) => variant.id)
        await Promise.all(
          variantPayload.map((payload, index) => {
            const existingId = variants[index]?.id
            return existingId
              ? api.patch(`/api/products/variants/${existingId}`, payload)
              : api.post(`/api/products/${id}/variants`, payload)
          }),
        )

        toast.success('Product updated.', { title: 'Saved' })
        reloadCatalog()

        // Refresh so newly created variants pick up their server ids.
        const fresh = await api.get(`/api/products/${id}`)
        setProduct({ ...EMPTY_PRODUCT, ...fresh.product })
        setVariants(fresh.product.variants)
        void original
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeVariant = async (index) => {
    const variant = variants[index]

    if (variants.length === 1) {
      toast.error('A product must keep at least one variant.')
      return
    }

    if (variant.id && !isNew) {
      try {
        await api.delete(`/api/products/variants/${variant.id}`)
        toast.success('Variant removed.')
      } catch (err) {
        toast.error(err.message)
        return
      }
    }

    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) return <LoadingBlock label="Loading product" />
  if (error) return <ErrorBlock message={error} />

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/admin/products')}
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      <form onSubmit={save}>
        <PageHeading
          title={isNew ? 'New product' : product.name || 'Edit product'}
          subtitle={isNew ? 'Add a compound to the catalogue.' : 'Update catalogue details and variants.'}
          actions={
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
            </Button>
          }
        />

        <Reveal className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <Card>
              <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" className="sm:col-span-2">
                  <Input value={product.name} onChange={(e) => setField('name', e.target.value)} />
                </Field>
                <Field label="Category" className="sm:col-span-2">
                  <Input
                    value={product.category}
                    onChange={(e) => setField('category', e.target.value)}
                  />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <Textarea
                    rows={5}
                    value={product.description}
                    onChange={(e) => setField('description', e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card padded={false}>
              <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                <h2 className="font-display text-[15px] font-bold text-ink">
                  Variants ({variants.length})
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add variant
                </Button>
              </div>

              <div className="divide-y divide-black/6">
                {variants.map((variant, index) => (
                  <div key={variant.id || `new-${index}`} className="relative p-4 md:p-5">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      aria-label="Remove variant"
                      className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                      <div className="mx-auto w-[180px] shrink-0 sm:mx-0 sm:w-[200px]">
                        <ImagePicker
                          square
                          label=""
                          value={variant.image}
                          onChange={(value) => setVariantField(index, 'image', value)}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-3 pr-8">
                        <div>
                          <p className="truncate font-display text-[15px] font-bold text-ink">
                            {product.name?.trim() || 'New product'}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            Variant {index + 1}
                            {variant.dose ? ` · ${variant.dose}` : ''}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Dose">
                            <Input
                              value={variant.dose}
                              onChange={(e) => setVariantField(index, 'dose', e.target.value)}
                              placeholder="5mg"
                            />
                          </Field>
                          <Field label="Price (USD)">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price}
                              onChange={(e) => setVariantField(index, 'price', e.target.value)}
                            />
                          </Field>
                          <Field label="Quantity">
                            <Input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) => setVariantField(index, 'stock', e.target.value)}
                            />
                          </Field>
                          <Field label="Weight (oz)">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={variant.weightOz}
                              onChange={(e) => setVariantField(index, 'weightOz', e.target.value)}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h2 className="mb-1 font-display text-[15px] font-bold text-ink">Main product image</h2>
              <p className="mb-4 text-[12px] leading-relaxed text-muted">
                This image appears on the shop page, homepage, and product listing cards.
              </p>
              <div className="w-[180px]">
                <ImagePicker
                  square
                  label=""
                  value={product.image}
                  onChange={(value) => setField('image', value)}
                />
              </div>

              {variants.some((variant) => variant.image) ? (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Or select a variant image
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants
                      .filter((variant) => variant.image)
                      .map((variant, index) => {
                        const selected = product.image === variant.image
                        return (
                          <button
                            key={`${variant.id || 'new'}-${index}`}
                            type="button"
                            onClick={() => setField('image', variant.image)}
                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                              selected
                                ? 'border-cyan shadow-[0_0_0_3px_rgba(0,245,212,0.16)]'
                                : 'border-transparent hover:border-black/15'
                            }`}
                            aria-label={`Use ${variant.dose || `variant ${index + 1}`} image as main`}
                          >
                            <img
                              src={assetUrl(variant.image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {selected ? (
                              <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-cyan text-navy shadow">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Visibility</h2>
              <div className="space-y-3">
                <Toggle
                  checked={product.isActive}
                  onChange={(value) => setField('isActive', value)}
                  label="Live on the storefront"
                  description="Hidden products stay in the catalogue but are not purchasable."
                />
                <Field label="Sort order" hint="Lower numbers appear first.">
                  <Input
                    type="number"
                    min="0"
                    value={product.sortOrder}
                    onChange={(e) => setField('sortOrder', e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <h2 className="mb-1 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                <Sparkles className="h-4 w-4 text-cyan-dim" />
                Homepage &amp; badge
              </h2>
              <p className="mb-4 text-[12px] leading-relaxed text-muted">
                Select up to four products for the homepage and add an optional label over the photo.
              </p>
              <div className="space-y-4">
                <Toggle
                  checked={product.showOnHome}
                  onChange={(value) => setField('showOnHome', value)}
                  label="Show on homepage"
                  description="Appears in the four-product homepage section."
                />
                {product.showOnHome ? (
                  <Field label="Homepage position" hint="Choose a unique position from 1 to 4.">
                    <select
                      value={product.homeOrder}
                      onChange={(event) => setField('homeOrder', Number(event.target.value))}
                      className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-[13px] text-ink outline-none transition focus:border-cyan"
                    >
                      {[0, 1, 2, 3].map((position) => (
                        <option key={position} value={position}>
                          Position {position + 1}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field
                  label="Photo badge"
                  hint="Optional — examples: HOT, FEATURED, NEW, LIMITED."
                >
                  <Input
                    value={product.badge}
                    maxLength={24}
                    placeholder="FEATURED"
                    onChange={(event) => setField('badge', event.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {['HOT', 'FEATURED', 'NEW', 'LIMITED'].map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setField('badge', badge)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] transition ${
                        product.badge === badge
                          ? 'bg-navy text-cyan'
                          : 'bg-fog text-muted hover:bg-fog-deep hover:text-ink'
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                  {product.badge ? (
                    <button
                      type="button"
                      onClick={() => setField('badge', '')}
                      className="rounded-full px-3 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Highlights</h2>
              <div className="flex gap-2">
                <Input
                  value={highlightDraft}
                  onChange={(e) => setHighlightDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addHighlight()
                    }
                  }}
                  placeholder="Batch COA available"
                />
                <Button variant="ghost" onClick={addHighlight}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {product.highlights?.length ? (
                <ul className="mt-3 space-y-2">
                  {product.highlights.map((highlight, index) => (
                    <li
                      key={`${highlight}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-xl bg-fog px-3 py-2"
                    >
                      <span className="min-w-0 truncate text-[12px] text-ink">{highlight}</span>
                      <button
                        type="button"
                        aria-label="Remove highlight"
                        onClick={() =>
                          setField(
                            'highlights',
                            product.highlights.filter((_, i) => i !== index),
                          )
                        }
                        className="shrink-0 text-muted transition hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12px] text-muted">
                  Highlights appear as bullet points on the product page.
                </p>
              )}
            </Card>
          </div>
        </Reveal>
      </form>
    </>
  )
}
