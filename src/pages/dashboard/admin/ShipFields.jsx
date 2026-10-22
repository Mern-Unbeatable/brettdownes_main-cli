import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { formatCents } from '../../../lib/api'

function filled(value) {
  const text = String(value ?? '').trim()
  return text && text !== '—' && text !== '-'
}

export function shipRows(order, { customer = false } = {}) {
  const method =
    [order.carrier, order.service].filter(Boolean).join(' ') ||
    (order.shippingLabel ? String(order.shippingLabel) : '')
  const parcel = order.parcel
    ? `${order.parcel.length} × ${order.parcel.width} × ${order.parcel.height} in · ${order.parcel.weightOz} oz`
    : ''

  const rows = customer
    ? [
        ['Name', order.contactName],
        ['Phone', order.contactPhone],
        ['Email', order.contactEmail],
        ['Address', order.address?.line1],
        ['Address 2', order.address?.line2],
        ['City', order.address?.city],
        ['State', order.address?.state],
        ['Zip', order.address?.zip],
        ['Country', order.address?.country],
      ]
    : [
        ['Queue', order.queueNumber],
        ['Order', order.orderNumber],
        ['Method', method],
        ['Shipping paid', Number.isFinite(order.shippingCents) ? formatCents(order.shippingCents) : ''],
        ['Package', parcel],
        ['Name', order.contactName],
        ['Phone', order.contactPhone],
        ['Email', order.contactEmail],
        ['Address', order.address?.line1],
        ['Address 2', order.address?.line2],
        ['City', order.address?.city],
        ['State', order.address?.state],
        ['Zip', order.address?.zip],
        ['Country', order.address?.country],
      ]

  return rows.filter(([, value]) => filled(value))
}

function CopyValue({ label, value }) {
  const [copied, setCopied] = useState(false)
  const text = String(value)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const input = document.createElement('textarea')
      input.value = text
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 bg-fog/40 px-4 py-2">
      <dt className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">{label}</dt>
      <dd className="text-right text-[13px] font-semibold break-words text-ink">{text}</dd>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-cyan-dim transition hover:bg-cyan/15 hover:text-navy"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function ShipFields({ order }) {
  const rows = shipRows(order)
  if (!rows.length) return null

  return (
    <dl className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/6">
      {rows.map(([label, value]) => (
        <CopyValue key={label} label={label} value={value} />
      ))}
    </dl>
  )
}
