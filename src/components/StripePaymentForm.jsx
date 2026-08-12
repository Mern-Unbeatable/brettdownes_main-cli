import { useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Lock } from 'lucide-react'
import { api, formatCents } from '../lib/api'
import { useToast } from './Toaster'

// loadStripe is memoised per key so the SDK is only fetched once.
const stripeCache = new Map()

function getStripePromise(publishableKey) {
  if (!publishableKey) return null
  if (!stripeCache.has(publishableKey)) {
    stripeCache.set(publishableKey, loadStripe(publishableKey))
  }
  return stripeCache.get(publishableKey)
}

function PaymentBody({ orderId, amountCents, descriptorNote, onPaid, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const pay = async (event) => {
    event.preventDefault()
    if (!stripe || !elements || submitting) return

    setSubmitting(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'That payment could not be completed.')
        return
      }

      // Confirm with our API, which verifies the PaymentIntent status with Stripe.
      const result = await api.post('/api/payments/confirm', { orderId })
      if (result.paid) {
        onPaid()
      } else {
        toast.warning('Payment is still processing. We will email you once it clears.')
        onPaid()
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {descriptorNote ? (
        <p className="rounded-2xl bg-fog px-4 py-3 text-[12px] leading-relaxed text-muted">
          {descriptorNote}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan py-3.5 text-sm font-semibold text-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Lock className="h-4 w-4" strokeWidth={2.2} />
        {submitting ? 'Processing…' : `Pay ${formatCents(amountCents)}`}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-center text-[12px] font-medium text-muted transition hover:text-ink"
      >
        Back to order details
      </button>
    </form>
  )
}

export default function StripePaymentForm({
  publishableKey,
  clientSecret,
  orderId,
  amountCents,
  descriptorNote,
  onPaid,
  onCancel,
}) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey])

  if (!stripePromise || !clientSecret) {
    return (
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
        Card payments are not configured. Choose warehouse pickup, or contact support to complete
        this order.
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'flat',
          variables: {
            colorPrimary: '#00c4ab',
            colorBackground: '#ffffff',
            colorText: '#111827',
            colorDanger: '#e11d48',
            borderRadius: '12px',
            fontFamily: 'Outfit, system-ui, sans-serif',
          },
        },
      }}
    >
      <PaymentBody
        orderId={orderId}
        amountCents={amountCents}
        descriptorNote={descriptorNote}
        onPaid={onPaid}
        onCancel={onCancel}
      />
    </Elements>
  )
}
