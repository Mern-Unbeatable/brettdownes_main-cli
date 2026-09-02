import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Info,
  MapPin,
  RefreshCw,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../components/Toaster'
import { lockBodyScroll, unlockBodyScroll } from '../hooks/lockBodyScroll'
import { api, assetUrl, formatCents, formatPrice } from '../lib/api'
import { calculateBulkDiscount } from '../utils/discounts'
import { groupRatesByCarrier } from '../utils/shipping'
import Seo from '../components/Seo'
import { pageSeo } from '../data/seo'

const DESCRIPTOR_NOTICE_MS = 3500

export default function CheckoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { items, subtotal, clearCart, count } = useCart()
  const { user, refresh } = useAuth()
  const settings = useSettings()

  const [fulfillment, setFulfillment] = useState('DELIVERY')
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })
  const [saveAddress, setSaveAddress] = useState(false)

  const [rates, setRates] = useState([])
  const [parcel, setParcel] = useState(null)
  const [shipmentId, setShipmentId] = useState(null)
  const [selectedRateId, setSelectedRateId] = useState('')
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState(null)

  const [placing, setPlacing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const redirectingRef = useRef(false)
  const [descriptorNotice, setDescriptorNotice] = useState(null)
  const [noticeProgress, setNoticeProgress] = useState(0)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [discountTiers, setDiscountTiers] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [applyCredit, setApplyCredit] = useState(true)

  useEffect(() => {
    api
      .get('/api/discounts/public')
      .then((data) => setDiscountTiers(data.tiers || []))
      .catch(() => setDiscountTiers([]))
  }, [])

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
    }))
  }, [user])

  // Prefill from the customer's default saved address.
  useEffect(() => {
    let active = true
    api
      .get('/api/auth/me/addresses')
      .then((data) => {
        const preferred = data.addresses?.find((entry) => entry.isDefault) || data.addresses?.[0]
        if (!active || !preferred) return
        setForm((prev) =>
          prev.address
            ? prev
            : {
                ...prev,
                address: preferred.line1,
                address2: preferred.line2 || '',
                city: preferred.city,
                state: preferred.state,
                zip: preferred.zip,
              },
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const pickupLocations = useMemo(() => {
    if (Array.isArray(settings.pickupLocations) && settings.pickupLocations.length) {
      return settings.pickupLocations
    }
    if (settings.pickupAddress?.name) {
      return [
        {
          id: settings.pickupAddress.id || 'default',
          name: settings.pickupAddress.name,
          lines: settings.pickupAddress.lines || [],
        },
      ]
    }
    return []
  }, [settings.pickupLocations, settings.pickupAddress])

  useEffect(() => {
    if (!pickupLocations.length) return
    setPickupLocationId((prev) =>
      pickupLocations.some((loc) => loc.id === prev) ? prev : pickupLocations[0].id,
    )
  }, [pickupLocations])

  const selectedPickup = pickupLocations.find((loc) => loc.id === pickupLocationId) || null

  const addressComplete =
    form.address.trim() && form.city.trim() && form.state.trim() && form.zip.trim().length >= 3

  const selectedRate = rates.find((rate) => rate.id === selectedRateId) || null
  const groupedRates = useMemo(() => groupRatesByCarrier(rates), [rates])

  const shippingCents =
    fulfillment === 'PICKUP' ? 0 : selectedRate ? selectedRate.amountCents : 0
  const subtotalCents = Math.round(subtotal * 100)
  const { discountCents: bulkDiscountCents, discountLabel } = calculateBulkDiscount(
    items,
    discountTiers,
  )
  const cartSignature = items.map((item) => `${item.variantId}:${item.qty}`).sort().join('|')
  const currentCoupon =
    appliedCoupon?.cartSignature === cartSignature ? appliedCoupon : null
  const couponDiscountCents = currentCoupon?.discountCents || 0
  const discountCents = Math.min(subtotalCents, bulkDiscountCents + couponDiscountCents)
  const merchandiseCents = Math.max(0, subtotalCents - discountCents)
  const availableCreditCents = Math.max(0, user?.creditCents || 0)
  const creditEligibleCents = Math.min(availableCreditCents, merchandiseCents)
  const creditCents = applyCredit ? creditEligibleCents : 0
  const totalCents = Math.max(0, merchandiseCents + shippingCents - creditCents)

  const applyCoupon = async () => {
    const code = couponCode.trim()
    if (!code) return
    setCouponLoading(true)
    try {
      const data = await api.post('/api/discounts/validate-coupon', {
        code,
        items: items.map((item) => ({ variantId: item.variantId, qty: item.qty })),
      })
      setAppliedCoupon({ ...data.coupon, cartSignature })
      setCouponCode(data.coupon.code)
      toast.success(`${data.coupon.code} applied.`)
    } catch (err) {
      setAppliedCoupon(null)
      toast.error(err.message)
    } finally {
      setCouponLoading(false)
    }
  }

  const fetchRates = useCallback(async () => {
    if (fulfillment !== 'DELIVERY' || !addressComplete || items.length === 0) return

    setRatesLoading(true)
    setRatesError(null)
    try {
      const data = await api.post('/api/shipping/rates', {
        items: items.map((item) => ({ variantId: item.variantId, qty: item.qty })),
        address: {
          name: form.fullName || user?.name,
          line1: form.address,
          line2: form.address2,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: 'US',
          phone: form.phone,
        },
      })
      setRates(data.rates || [])
      setParcel(data.parcel || null)
      setShipmentId(data.shipmentId)
      setSelectedRateId((current) =>
        data.rates?.some((rate) => rate.id === current) ? current : data.rates?.[0]?.id || '',
      )
    } catch (err) {
      setRates([])
      setParcel(null)
      setShipmentId(null)
      setSelectedRateId('')
      setRatesError(err.message)
    } finally {
      setRatesLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced on the address fields below
  }, [fulfillment, addressComplete, items, form.address, form.address2, form.city, form.state, form.zip])

  // Re-quote shortly after the address stops changing.
  useEffect(() => {
    if (fulfillment !== 'DELIVERY' || !addressComplete) {
      setRates([])
      setParcel(null)
      setSelectedRateId('')
      setRatesError(null)
      return undefined
    }

    const timer = window.setTimeout(fetchRates, 700)
    return () => window.clearTimeout(timer)
  }, [fulfillment, addressComplete, fetchRates])

  const canPlace = useMemo(() => {
    if (items.length === 0 || placing) return false
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return false
    if (fulfillment === 'DELIVERY') {
      if (!addressComplete) return false
      if (!shipmentId || !selectedRateId) return false
    }
    if (fulfillment === 'PICKUP' && !pickupLocationId) return false
    return true
  }, [
    items.length,
    placing,
    form,
    fulfillment,
    addressComplete,
    shipmentId,
    selectedRateId,
    pickupLocationId,
  ])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    if (!canPlace) return

    setPlacing(true)
    try {
      const { order } = await api.post('/api/orders', {
        items: items.map((item) => ({ variantId: item.variantId, qty: item.qty })),
        fulfillment,
        contact: {
          name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        ...(fulfillment === 'DELIVERY'
          ? {
              address: {
                line1: form.address.trim(),
                line2: form.address2.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                zip: form.zip.trim(),
                country: 'US',
              },
              shipmentId,
              rateId: selectedRateId,
              saveAddress,
            }
          : {
              pickupLocationId,
            }),
        notes: form.notes.trim(),
        couponCode: currentCoupon?.code || '',
        applyCredit: applyCredit && creditEligibleCents > 0,
      })

      if (order.paymentMethod === 'PICKUP' || (order.paymentStatus === 'PAID' && order.totalCents === 0)) {
        if (order.creditCents > 0) refresh().catch(() => {})
        clearCart()
        setPlacedOrder(order)
        return
      }

      // Delivery orders: statement-descriptor notice, then Stripe Checkout (hosted).
      if (order.creditCents > 0) refresh().catch(() => {})
      setDescriptorNotice({ order })
      setNoticeProgress(0)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPlacing(false)
    }
  }

  const continueToStripe = useCallback(async () => {
    const notice = descriptorNotice
    if (!notice?.order || redirectingRef.current) return

    redirectingRef.current = true
    setRedirecting(true)
    try {
      const session = await api.post('/api/payments/checkout-session', {
        orderId: notice.order.id,
      })
      if (!session?.url) throw new Error('Could not start Stripe Checkout.')
      window.location.assign(session.url)
    } catch (err) {
      redirectingRef.current = false
      setRedirecting(false)
      setDescriptorNotice(null)
      toast.error(err.message)
    }
  }, [descriptorNotice, toast])

  useEffect(() => {
    if (!descriptorNotice || redirectingRef.current) return undefined

    lockBodyScroll()
    const started = Date.now()
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started
      setNoticeProgress(Math.min(1, elapsed / DESCRIPTOR_NOTICE_MS))
    }, 50)

    const timer = window.setTimeout(() => {
      continueToStripe()
    }, DESCRIPTOR_NOTICE_MS)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(timer)
      unlockBodyScroll()
    }
  }, [descriptorNotice, continueToStripe])

  if (placedOrder) {
    const isPickup = placedOrder.fulfillment === 'PICKUP'

    return (
      <PageTransition>
        <Seo {...pageSeo.checkout} />
        <PageHeader
          title="Order placed"
          subtitle="Thanks — we received your research order."
          image="/images/lab-line.png"
        />
        <main className="bg-white py-16 md:py-24">
          <div data-reveal="scale" className="mx-auto max-w-xl px-5 text-center md:px-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-cyan" strokeWidth={1.6} />
            <h2 className="mt-5 font-display text-2xl font-bold text-ink">
              Order {placedOrder.orderNumber} confirmed
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {isPickup
                ? [
                    selectedPickup || placedOrder.pickupLocation
                      ? `Pickup at ${(selectedPickup || placedOrder.pickupLocation).name}.`
                      : null,
                    settings.pickupNote ||
                      'Bring your confirmation email and photo ID. Payment is taken at the warehouse.',
                  ]
                    .filter(Boolean)
                    .join(' ')
                : 'A confirmation email is on its way. You will receive tracking as soon as the label is created.'}
            </p>
            <p className="mt-4 font-display text-xl font-bold text-ink">
              {formatCents(placedOrder.totalCents)}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to={`/dashboard/orders/${placedOrder.id}`}
                className="rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
              >
                View order
              </Link>
              <Link
                to="/shop"
                className="rounded-xl bg-fog px-6 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
              >
                Continue shopping
              </Link>
            </div>
            <p className="mt-8 text-[11px] text-muted">
              For Research Use Only; Not for Human Consumption.
            </p>
          </div>
        </main>
        <Footer />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <Seo {...pageSeo.checkout} />
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
                className="mt-5 rounded-xl bg-cyan px-5 py-3 text-sm font-semibold text-navy"
              >
                Open shop
              </button>
            </div>
          ) : (
            <form
              onSubmit={placeOrder}
              className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12"
            >
              <div data-reveal-stagger data-stagger="0.12" className="space-y-8">
                    <section className="relative overflow-hidden rounded-3xl border border-cyan/35 bg-gradient-to-br from-cyan/15 via-fog to-white p-6 shadow-[0_0_0_1px_rgba(0,196,171,0.12)] md:p-8">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-cyan/20 blur-2xl"
                      />
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan text-navy shadow-sm">
                            <FileCheck2 className="h-6 w-6" strokeWidth={1.9} />
                          </span>
                          <div>
                            <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-dim uppercase">
                              Certificates of Analysis
                            </p>
                            <h3 className="mt-1.5 font-display text-lg font-bold text-ink">
                              Lab-tested products — COAs available
                            </h3>
                            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted">
                              We verify analytical certificates from our manufacturing partners and
                              publish independent third-party lab reports as they are completed.
                              Testing is periodic rather than on every batch — see the COA library
                              for what is currently available.
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/coa"
                          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
                        >
                          View COA
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </section>

                    <section className="rounded-3xl bg-fog p-6 md:p-8">
                      <h3 className="font-display text-lg font-bold text-ink">Contact info</h3>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Full name"
                          name="fullName"
                          value={form.fullName}
                          onChange={onChange}
                          required
                        />
                        <Field
                          label="Email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={onChange}
                          required
                        />
                        <Field
                          label="Phone"
                          name="phone"
                          value={form.phone}
                          onChange={onChange}
                          required
                          className="sm:col-span-2"
                        />
                      </div>
                    </section>

                    <section className="rounded-3xl bg-fog p-6 md:p-8">
                      <h3 className="font-display text-lg font-bold text-ink">Delivery method</h3>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <OptionCard
                          active={fulfillment === 'DELIVERY'}
                          onClick={() => setFulfillment('DELIVERY')}
                          icon={Truck}
                          title="Delivery"
                          text="Live USPS, UPS and FedEx rates"
                        />
                        <OptionCard
                          active={fulfillment === 'PICKUP'}
                          onClick={() => setFulfillment('PICKUP')}
                          icon={Building2}
                          title="Warehouse pickup"
                          text="Pay on collection in Keizer, OR"
                        />
                      </div>

                      {fulfillment === 'DELIVERY' ? (
                        <>
                          <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <Field
                              label="Street address"
                              name="address"
                              value={form.address}
                              onChange={onChange}
                              required
                              className="sm:col-span-3"
                            />
                            <Field
                              label="Apt / suite (optional)"
                              name="address2"
                              value={form.address2}
                              onChange={onChange}
                              className="sm:col-span-3"
                            />
                            <Field label="City" name="city" value={form.city} onChange={onChange} required />
                            <Field
                              label="State"
                              name="state"
                              value={form.state}
                              onChange={onChange}
                              required
                            />
                            <Field label="ZIP" name="zip" value={form.zip} onChange={onChange} required />
                          </div>

                          <label className="mt-4 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={saveAddress}
                              onChange={(event) => setSaveAddress(event.target.checked)}
                              className="h-4 w-4 accent-[#00c4ab]"
                            />
                            <span className="text-[13px] text-ink">
                              Save this address for future orders
                            </span>
                          </label>

                          <div className="mt-6">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-ink">Shipping rate</p>
                              {addressComplete ? (
                                <button
                                  type="button"
                                  onClick={fetchRates}
                                  disabled={ratesLoading}
                                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan-dim transition hover:text-ink disabled:opacity-50"
                                >
                                  <RefreshCw
                                    className={`h-3.5 w-3.5 ${ratesLoading ? 'animate-spin' : ''}`}
                                  />
                                  Refresh
                                </button>
                              ) : null}
                            </div>

                            {!addressComplete ? (
                              <p className="rounded-2xl bg-white px-4 py-3 text-[12px] text-muted">
                                Enter your full address to see live carrier rates.
                              </p>
                            ) : ratesLoading ? (
                              <p className="rounded-2xl bg-white px-4 py-3 text-[12px] text-muted">
                                Fetching live carrier rates…
                              </p>
                            ) : ratesError ? (
                              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
                                {ratesError}
                              </p>
                            ) : rates.length === 0 ? (
                              <p className="rounded-2xl bg-white px-4 py-3 text-[12px] text-muted">
                                No rates yet. Check the address, or switch to warehouse pickup.
                              </p>
                            ) : (
                              <>
                              {parcel ? (
                                <p className="mb-3 rounded-2xl border border-cyan/20 bg-cyan/5 px-4 py-3 text-[12px] leading-relaxed text-ink">
                                  Package used for rates:{' '}
                                  <span className="font-semibold">
                                    {parcel.length} × {parcel.width} × {parcel.height} in
                                  </span>
                                  {' · '}
                                  <span className="font-semibold">{parcel.weight} oz</span>
                                  {' '}
                                  <span className="text-muted">
                                    ({(Number(parcel.weight) / 16).toFixed(2)} lb)
                                  </span>
                                </p>
                              ) : null}
                              <div className="space-y-5">
                                {groupedRates.map((group) => (
                                  <section key={group.carrier}>
                                    <p className="mb-2 text-[11px] font-bold tracking-[0.22em] text-muted uppercase">
                                      {group.carrier}
                                    </p>
                                    <ul className="space-y-2">
                                      {group.rates.map((rate) => (
                                        <li key={rate.id}>
                                          <label
                                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                                              selectedRateId === rate.id
                                                ? 'border-cyan bg-white shadow-sm'
                                                : 'border-transparent bg-white/70 hover:bg-white'
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name="rate"
                                              value={rate.id}
                                              checked={selectedRateId === rate.id}
                                              onChange={() => setSelectedRateId(rate.id)}
                                              className="h-4 w-4 accent-[#00c4ab]"
                                            />
                                            <span className="min-w-0 flex-1">
                                              <span className="block text-sm font-semibold text-ink">
                                                {rate.service}
                                              </span>
                                              <span className="block text-xs text-muted">
                                                {rate.deliveryDays
                                                  ? `Approx. ${rate.deliveryDays} business day${rate.deliveryDays === 1 ? '' : 's'}`
                                                  : 'Transit time varies'}
                                              </span>
                                            </span>
                                            <span className="font-display text-base font-bold text-ink">
                                              {rate.amountCents === 0
                                                ? 'Free'
                                                : formatCents(rate.amountCents)}
                                            </span>
                                          </label>
                                        </li>
                                      ))}
                                    </ul>
                                  </section>
                                ))}
                              </div>
                              </>
                            )}
                          </div>

                          {settings.deliveryNote ? (
                            <div className="mt-5 flex gap-3 rounded-2xl bg-white p-4">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-dim" />
                              <p className="text-[12px] leading-relaxed text-muted">
                                {settings.deliveryNote}
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="mt-5 space-y-3">
                          <p className="text-[12px] font-semibold text-ink">Choose a pickup location</p>
                          <ul className="space-y-2">
                            {pickupLocations.map((location) => {
                              const active = pickupLocationId === location.id
                              return (
                                <li key={location.id}>
                                  <label
                                    className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition ${
                                      active
                                        ? 'border-cyan shadow-[0_0_0_1px_rgba(0,245,212,0.35)]'
                                        : 'border-black/8 hover:border-black/20'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="pickupLocation"
                                      className="mt-1 h-4 w-4 accent-[#00c4ab]"
                                      checked={active}
                                      onChange={() => setPickupLocationId(location.id)}
                                    />
                                    <span className="min-w-0">
                                      <span className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-dim" />
                                        <span>
                                          <span className="block text-sm font-semibold text-ink">
                                            {location.name}
                                          </span>
                                          {(location.lines || []).map((line) => (
                                            <span
                                              key={line}
                                              className="mt-0.5 block text-[12px] text-muted"
                                            >
                                              {line}
                                            </span>
                                          ))}
                                        </span>
                                      </span>
                                    </span>
                                  </label>
                                </li>
                              )
                            })}
                          </ul>
                          {settings.pickupNote ? (
                            <div className="flex gap-3 rounded-2xl bg-white p-4">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-dim" />
                              <p className="text-[12px] leading-relaxed text-muted">
                                {settings.pickupNote}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </section>

                    <section className="rounded-3xl bg-fog p-6 md:p-8">
                      <h3 className="font-display text-lg font-bold text-ink">Payment method</h3>

                      <div className="mt-5 flex gap-3 rounded-2xl bg-white p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                          {fulfillment === 'PICKUP' ? (
                            <Wallet className="h-5 w-5" strokeWidth={1.8} />
                          ) : (
                            <CreditCard className="h-5 w-5" strokeWidth={1.8} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">
                            {fulfillment === 'PICKUP'
                              ? 'Manual payment at the warehouse'
                              : 'Secure card payment'}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">
                            {fulfillment === 'PICKUP'
                              ? 'No card is charged online. Settle up when you collect your order.'
                              : 'Card details are handled by Stripe and never touch our servers.'}
                          </p>
                        </div>
                      </div>

                      {fulfillment === 'DELIVERY' && settings.paymentDescriptorNote ? (
                        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[12px] leading-relaxed text-muted">
                          {settings.paymentDescriptorNote}
                        </p>
                      ) : null}

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
                <h3 className="font-display text-lg font-bold text-ink">Order summary ({count})</h3>
                <ul className="mt-5 space-y-4">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                      <img
                        src={assetUrl(item.image)}
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

                <div className="mt-5 rounded-2xl bg-fog p-3.5">
                  <label
                    htmlFor="coupon-code"
                    className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-ink"
                  >
                    <Tag className="h-3.5 w-3.5 text-cyan-dim" />
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon-code"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase())
                        if (appliedCoupon && event.target.value.toUpperCase() !== appliedCoupon.code) {
                          setAppliedCoupon(null)
                        }
                      }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 text-sm font-semibold tracking-wide text-ink uppercase outline-none transition focus:border-cyan"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="rounded-xl bg-ink px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-navy disabled:opacity-40"
                    >
                      {couponLoading ? 'Checking…' : currentCoupon ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {currentCoupon ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-emerald-700">
                        {currentCoupon.description || 'Coupon applied successfully.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode('')
                          setAppliedCoupon(null)
                        }}
                        className="font-semibold text-muted hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                {availableCreditCents > 0 ? (
                  <div className="mt-3 rounded-2xl border border-cyan/25 bg-cyan/5 p-3.5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={applyCredit}
                        onChange={(event) => setApplyCredit(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-black/20 text-cyan accent-cyan"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                          <Wallet className="h-3.5 w-3.5 text-cyan-dim" />
                          Use account credit
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                          {formatCents(availableCreditCents)} available · applies to products only,
                          not shipping
                          {applyCredit && creditEligibleCents > 0
                            ? ` · −${formatCents(creditEligibleCents)} on this order`
                            : ''}
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}

                <div className="mt-5 space-y-2 border-t border-black/8 pt-4 text-sm">
                  <Row label="Subtotal" value={formatCents(subtotalCents)} />
                  {bulkDiscountCents > 0 ? (
                    <Row
                      label={`Bulk reward${discountLabel ? ` (${discountLabel})` : ''}`}
                      value={`-${formatCents(bulkDiscountCents)}`}
                    />
                  ) : null}
                  {couponDiscountCents > 0 ? (
                    <Row
                      label={`Coupon (${currentCoupon.code})`}
                      value={`-${formatCents(couponDiscountCents)}`}
                    />
                  ) : null}
                  {creditCents > 0 ? (
                    <Row label="Account credit" value={`-${formatCents(creditCents)}`} />
                  ) : null}
                  <Row
                    label={fulfillment === 'PICKUP' ? 'Pickup' : 'Shipping'}
                    value={
                      fulfillment === 'PICKUP'
                        ? 'Free'
                        : selectedRate
                          ? shippingCents === 0
                            ? 'Free'
                            : formatCents(shippingCents)
                          : 'Calculated at next step'
                    }
                  />
                  <Row label="Total" value={formatCents(totalCents)} bold />
                </div>

                {!descriptorNotice && !redirecting ? (
                  <button
                    type="submit"
                    disabled={!canPlace}
                    className="mt-6 w-full rounded-xl bg-cyan py-3.5 text-sm font-semibold text-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {placing
                      ? 'Placing order…'
                      : fulfillment === 'PICKUP'
                        ? 'Place pickup order'
                        : 'Continue to payment'}
                  </button>
                ) : (
                  <p className="mt-6 rounded-xl bg-fog px-4 py-3 text-center text-[12px] text-muted">
                    Redirecting to secure Stripe Checkout…
                  </p>
                )}

                <p className="mt-3 text-center text-[11px] text-muted">
                  For Research Use Only; Not for Human Consumption.
                </p>
              </aside>
            </form>
          )}
        </div>
      </main>

      <Footer />

      {createPortal(
        <AnimatePresence>
          {descriptorNotice ? (
            <>
              <motion.button
                type="button"
                aria-label="Statement descriptor notice"
                className="fixed inset-0 z-[10070] bg-navy/50 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="descriptor-notice-title"
                className="fixed inset-0 z-[10080] flex items-center justify-center p-4 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-[0_24px_80px_rgba(5,11,20,0.22)]"
                  initial={{ opacity: 0, y: 22, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-6 pt-7 pb-6 sm:px-7">
                    <p className="text-[11px] font-bold tracking-[0.16em] text-cyan-dim uppercase">
                      Payments
                    </p>
                    <h2
                      id="descriptor-notice-title"
                      className="mt-2 font-display text-xl font-bold text-ink"
                    >
                      Card statement descriptor
                    </h2>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">
                      {settings.paymentDescriptorNote ||
                        'This charge will appear on your bank statement under the name below — not Peptide Ops Logistics.'}
                    </p>
                    <div className="mt-5 rounded-2xl border border-cyan/25 bg-cyan/5 px-4 py-4 text-center">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                        Your statement will show
                      </p>
                      <p className="mt-2 font-display text-lg font-bold text-ink">
                        {settings.statementDescriptor || 'That 3D Printer Guy'}
                      </p>
                    </div>
                    <p className="mt-4 text-center text-[12px] text-muted">
                      {redirecting
                        ? 'Opening Stripe Checkout…'
                        : 'Continuing to secure Stripe Checkout…'}
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fog">
                      <div
                        className="h-full rounded-full bg-cyan transition-[width] duration-75 ease-linear"
                        style={{ width: `${Math.round(noticeProgress * 100)}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={continueToStripe}
                      disabled={redirecting}
                      className="mt-5 w-full rounded-xl bg-cyan py-3 text-sm font-semibold text-navy transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                    >
                      {redirecting ? 'Redirecting…' : 'Continue to Stripe'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
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
      className={`flex h-full min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-cyan bg-white shadow-sm'
          : 'border-transparent bg-white/60 hover:border-black/10 hover:bg-white'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-cyan/15 text-cyan' : 'bg-fog text-muted'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
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
