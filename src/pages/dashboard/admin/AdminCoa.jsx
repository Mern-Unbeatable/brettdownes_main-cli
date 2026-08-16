import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ExternalLink,
  Eye,
  FilePlus2,
  FileText,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { api, assetUrl } from '../../../lib/api'
import { isImageDocument, pdfViewerUrl } from '../../../utils/coaFiles'
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
  Select,
  Textarea,
  Toggle,
} from '../ui'

const EMPTY_DOCUMENT = {
  productId: '',
  name: '',
  content: '',
  documentUrl: '',
  isPublished: true,
  sortOrder: 0,
}

export default function AdminCoa() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(null)
  const [preview, setPreview] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.get('/api/coa/admin'), api.get('/api/products?includeInactive=true')])
      .then(([coaData, productData]) => {
        setDocuments(coaData.documents || [])
        setProducts(productData.products || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return documents
    return documents.filter((document) =>
      `${document.name} ${document.content} ${document.product?.name || ''}`
        .toLowerCase()
        .includes(term),
    )
  }, [documents, search])

  const openNew = (productId = '') => {
    setDraft({
      ...EMPTY_DOCUMENT,
      productId: productId || products[0]?.id || '',
    })
  }

  const uploadFile = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      toast.error('Choose a PDF or an image file.')
      return
    }
    setUploading(true)
    try {
      const data = await api.upload('/api/uploads/document', file)
      setDraft((current) => ({ ...current, documentUrl: data.url }))
      toast.success('File uploaded.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = async () => {
    if (!draft?.productId || !draft.name.trim()) {
      toast.error('Choose a product and enter a document name.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        productId: draft.productId,
        name: draft.name.trim(),
        content: draft.content.trim(),
        documentUrl: draft.documentUrl || '',
        isPublished: draft.isPublished,
        sortOrder: Number(draft.sortOrder) || 0,
      }
      const data = draft.id
        ? await api.patch(`/api/coa/admin/${draft.id}`, payload)
        : await api.post('/api/coa/admin', payload)
      setDocuments((current) =>
        draft.id
          ? current.map((entry) => (entry.id === draft.id ? data.document : entry))
          : [...current, data.document],
      )
      setDraft(null)
      toast.success('COA document saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    try {
      await api.delete(`/api/coa/admin/${pendingDelete.id}`)
      setDocuments((current) => current.filter((entry) => entry.id !== pendingDelete.id))
      setPendingDelete(null)
      toast.success('COA document removed.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <LoadingBlock label="Loading COA documents" />
  if (error) return <ErrorBlock message={error} onRetry={load} />

  return (
    <>
      <PageHeading
        title="COA library"
        subtitle={`${documents.length} certificate${documents.length === 1 ? '' : 's'} across your products`}
        actions={
          <Button onClick={() => openNew()}>
            <FilePlus2 className="h-4 w-4" /> Add document
          </Button>
        }
      />

      <Card className="mb-5">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, certificate name or text"
            className="pl-10"
          />
        </div>
      </Card>

      {filtered.length ? (
        <div className="space-y-6">
          {[...new Set(filtered.map((document) => document.productId))].map((productId) => {
            const product = filtered.find((document) => document.productId === productId)?.product
            const productDocuments = filtered.filter((document) => document.productId === productId)
            return (
              <section key={productId}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={assetUrl(product?.image)}
                      alt=""
                      className="h-10 w-10 rounded-xl bg-white object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-[15px] font-bold text-ink">
                        {product?.name || 'Deleted product'}
                      </h2>
                      <p className="text-[11px] text-muted">
                        {productDocuments.length} document{productDocuments.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openNew(productId)}>
                    <FilePlus2 className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {productDocuments.map((document) => (
                    <Card
                      key={document.id}
                      className="flex cursor-pointer items-start gap-4 transition hover:border-cyan/35 hover:shadow-md"
                      onClick={() => setPreview(document)}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/12 text-cyan-dim">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-[14px] font-bold text-ink">
                              {document.name}
                            </p>
                            <Badge tone={document.isPublished ? 'ACTIVE' : 'BLOCKED'}>
                              {document.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <div
                            className="flex shrink-0 gap-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setPreview(document)}
                              className="cursor-pointer rounded-lg p-2 text-muted hover:bg-fog hover:text-ink"
                              title="View like storefront"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {document.documentUrl ? (
                              <a
                                href={assetUrl(document.documentUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="cursor-pointer rounded-lg p-2 text-muted hover:bg-fog hover:text-ink"
                                title="Open file"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setDraft({ ...document })}
                              className="cursor-pointer rounded-lg p-2 text-muted hover:bg-fog hover:text-ink"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(document)}
                              className="cursor-pointer rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-[12px] text-muted">
                          {document.documentUrl
                            ? isImageDocument(document.documentUrl)
                              ? 'Image certificate attached'
                              : 'PDF certificate attached'
                            : 'Text certificate'}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={documents.length ? 'No matching documents' : 'No COA documents yet'}
          message={
            documents.length
              ? 'Try another product or certificate name.'
              : 'Add certificates and supporting text under each product.'
          }
          action={!documents.length ? <Button onClick={() => openNew()}>Add document</Button> : null}
        />
      )}

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit COA document' : 'Add COA document'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button disabled={saving || uploading} onClick={save}>
              {saving ? 'Saving…' : 'Save document'}
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product">
                <Select
                  value={draft.productId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, productId: event.target.value }))
                  }
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Certificate name">
                <Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Batch 2026-08 · HPLC/MS"
                />
              </Field>
            </div>
            <Field label="Certificate text" hint="Shown in full when a customer opens this document.">
              <Textarea
                rows={7}
                value={draft.content}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="Lab, batch, purity result, test date and any notes…"
              />
            </Field>
            <Field
              label="Certificate file"
              hint="Optional. Upload a PDF or an image (JPG, PNG, WEBP)."
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={(event) => uploadFile(event.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-black/15 bg-fog p-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : draft.documentUrl ? 'Replace file' : 'Upload file'}
                </Button>
                {draft.documentUrl ? (
                  <>
                    <a
                      href={assetUrl(draft.documentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold text-cyan-dim hover:text-ink"
                    >
                      View current file
                    </a>
                    <button
                      type="button"
                      onClick={() => setDraft((current) => ({ ...current, documentUrl: '' }))}
                      aria-label="Remove file"
                      title="Remove file"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-[12px] text-muted">No file selected</span>
                )}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display order">
                <Input
                  type="number"
                  min="0"
                  value={draft.sortOrder}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                />
              </Field>
              <div className="flex items-end">
                <Toggle
                  checked={draft.isPublished}
                  onChange={(isPublished) =>
                    setDraft((current) => ({ ...current, isPublished }))
                  }
                  label="Published"
                  description="Visible in the customer COA library."
                />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name || 'Certificate preview'}
        size="lg"
        footer={
          <>
            {preview?.documentUrl ? (
              <Button as="a" href={assetUrl(preview.documentUrl)} target="_blank" rel="noreferrer" variant="outline">
                <ExternalLink className="h-4 w-4" /> Open full size
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
            <Button
              onClick={() => {
                setDraft({ ...preview })
                setPreview(null)
              }}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </>
        }
      >
        {preview ? (
          <div className={preview.documentUrl ? 'grid gap-5 lg:grid-cols-[0.42fr_0.58fr]' : ''}>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-cyan-dim uppercase">
                {preview.product?.name}
              </p>
              <p className="mt-3 text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
                Certificate details
              </p>
              <div className="mt-2 whitespace-pre-line text-sm leading-7 text-ink">
                {preview.content || 'No additional certificate notes were provided.'}
              </div>
            </div>
            {preview.documentUrl ? (
              <div className="overflow-hidden rounded-2xl border border-black/8 bg-fog p-3">
                {isImageDocument(preview.documentUrl) ? (
                  <img
                    src={assetUrl(preview.documentUrl)}
                    alt={preview.name}
                    className="mx-auto max-h-[55vh] w-full rounded-xl bg-white object-contain"
                  />
                ) : (
                  <object
                    data={pdfViewerUrl(assetUrl(preview.documentUrl))}
                    type="application/pdf"
                    aria-label={`${preview.name} certificate`}
                    className="h-[55vh] w-full rounded-xl bg-white"
                  >
                    <a
                      href={assetUrl(preview.documentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-6 text-center text-[13px] font-semibold text-cyan-dim"
                    >
                      Open certificate
                    </a>
                  </object>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete COA document?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p className="text-[13px] text-muted">
          Remove <span className="font-semibold text-ink">{pendingDelete?.name}</span> from the COA library?
        </p>
      </Modal>
    </>
  )
}
