import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  Truck,
  Wallet,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/site'

const WAREHOUSE = {
  name: 'Peptide Ops Logistics',
  lines: ['4472 River Rd N', 'PMB #1020', 'Keizer, OR 97303'],
}

const SHIPPING_FEE = 12

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart, count } = useCart()
  const [delivery, setDelivery] = useState('delivery')
  const [payment, setPayment] = useState('manual')
  const [placed, setPlaced] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  const shipping = delivery === 'delivery' && items.length > 0 ? SHIPPING_FEE : 0
  const total = subtotal + shipping

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return false
    if (delivery === 'delivery') {
      if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim()) {
        return false
      }
    }
    return true
  }, [items.length, form, delivery])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    if (payment === 'online') {
      // Stripe integration placeholder — wire keys/backend later
      alert(
        'Online payment (Stripe) will open here. For now, switch to Manual payment or continue setup.',
      )
      return
    }

    setPlaced(true)
    clearCart()
  }

  if (placed) {
    return (
      <PageTransition>
        <PageHeader
          title="Order placed"
          subtitle="Thanks — we received your research order."
          image="/images/lab-line.png"
        />
        <main className="bg-white py-16 md:py-24">
          <div data-reveal="scale" className="mx-auto max-w-xl px-5 text-center md:px-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-cyan" strokeWidth={1.6} />
            <h2 className="mt-5 font-display text-2xl font-bold text-ink">Order confirmed</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We will confirm by email. Manual payment instructions will be sent shortly. Research
              use only.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/shop"
                className="rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-ink transition hover:bg-cyan-dim"
              >
                Continue shopping
              </Link>
              <Link
                to="/"
                className="rounded-xl bg-fog px-6 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
              >
                Back home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader
        title="Checkout"
        subtitle="Complete your order details, delivery preference, and payment method."
        image="/images/lab-line.png"
      />

      <main className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-10xl px-5 md:px-8">
          <Link
            data-reveal="fade"
            to="/shop"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>

          {items.length === 0 ? (
            <div data-reveal="scale" className="rounded-3xl bg-fog px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-ink">Your cart is empty</p>
              <p className="mt-2 text-sm text-muted">Add peptides from the shop before checkout.</p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="mt-5 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-ink"
              >
                Open shop
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12"
            >
              <div data-reveal-stagger data-stagger="0.12" className="space-y-8">
                <section className="rounded-3xl bg-fog p-6 md:p-8">
                  <h3 className="font-display text-lg font-bold text-ink">Contact info</h3>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" name="fullName" value={form.fullName} onChange={onChange} required />
                    <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
                    <Field label="Phone" name="phone" value={form.phone} onChange={onChange} required className="sm:col-span-2" />
                  </div>
                </section>

                <section className="rounded-3xl bg-fog p-6 md:p-8">
                  <h3 className="font-display text-lg font-bold text-ink">Delivery method</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <OptionCard
                      active={delivery === 'delivery'}
                      onClick={() => setDelivery('delivery')}
                      icon={Truck}
                      title="Delivery"
                      text="Ship to your address (+$12.00)"
                    />
                    <OptionCard
                      active={delivery === 'pickup'}
                      onClick={() => setDelivery('pickup')}
                      icon={Building2}
                      title="Warehouse pickup"
                      text="Pick up from Keizer, OR"
                    />
                  </div>

                  {delivery === 'delivery' ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Street address"
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        required
                        className="sm:col-span-2"
                      />
                      <Field label="City" name="city" value={form.city} onChange={onChange} required />
                      <Field label="State" name="state" value={form.state} onChange={onChange} required />
                      <Field label="ZIP" name="zip" value={form.zip} onChange={onChange} required />
                    </div>
                  ) : (
                    <div className="mt-5 flex gap-3 rounded-2xl bg-white p-4 text-sm text-muted">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
                      <div>
                        <p className="font-medium text-ink">{WAREHOUSE.name}</p>
                        {WAREHOUSE.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        <p className="mt-2 text-xs">Bring your order confirmation email for pickup.</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl bg-fog p-6 md:p-8">
                  <h3 className="font-display text-lg font-bold text-ink">Payment method</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <OptionCard
                      active={payment === 'manual'}
                      onClick={() => setPayment('manual')}
                      icon={Wallet}
                      title="Manual payment"
                    />
                    <OptionCard
                      active={payment === 'online'}
                      onClick={() => setPayment('online')}
                      icon={CreditCard}
                      title="Pay online"
                      text="Secure checkout with Stripe"
                    />
                  </div>
                  {payment === 'online' ? (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs text-muted">
                      Stripe online payment will be connected next. You can place the order with
                      Manual payment today.
                    </p>
                  ) : (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs text-muted">
                      After you place the order, we will email payment instructions and confirm when
                      funds are received.
                    </p>
                  )}

                  <div className="mt-5">
                    <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink">
                      Order notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={onChange}
                      className="w-full resize-y rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
                      placeholder="PO number, pickup time window, research notes…"
                    />
                  </div>
                </section>
              </div>

              <aside
                data-reveal="right"
                data-reveal-delay="0.15"
                className="h-fit rounded-3xl border border-black/6 bg-white p-6 shadow-sm lg:sticky lg:top-24"
              >
                <h3 className="font-display text-lg font-bold text-ink">
                  Order summary ({count})
                </h3>
                <ul className="mt-5 space-y-4">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl bg-fog object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-muted">
                          {item.dose} × {item.qty}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-ink">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 space-y-2 border-t border-black/8 pt-4 text-sm">
                  <Row label="Subtotal" value={formatPrice(subtotal)} />
                  <Row
                    label={delivery === 'pickup' ? 'Pickup' : 'Delivery'}
                    value={delivery === 'pickup' ? 'Free' : formatPrice(shipping)}
                  />
                  <Row label="Total" value={formatPrice(total)} bold />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="mt-6 w-full rounded-xl bg-cyan py-3.5 text-sm font-semibold text-ink transition hover:bg-cyan-dim disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {payment === 'online' ? 'Continue to Stripe' : 'Place order'}
                </button>
                <p className="mt-3 text-center text-[11px] text-muted">
                  Research use only. By ordering you confirm eligible research use.
                </p>
              </aside>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}

function Field({ label, name, value, onChange, type = 'text', required, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan"
      />
    </div>
  )
}

function OptionCard({ active, onClick, icon: Icon, title, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-cyan bg-white shadow-sm'
          : 'border-transparent bg-white/60 hover:border-black/10 hover:bg-white'
      }`}
    >
      <span
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-cyan/15 text-cyan' : 'bg-fog text-muted'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {text ? <span className="mt-0.5 block text-xs text-muted">{text}</span> : null}
      </span>
    </button>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'pt-1' : ''}`}>
      <span className={bold ? 'font-semibold text-ink' : 'text-muted'}>{label}</span>
      <span className={bold ? 'font-display text-lg font-bold text-ink' : 'text-ink'}>{value}</span>
    </div>
  )
}
