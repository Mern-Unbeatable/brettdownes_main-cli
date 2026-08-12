import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { api, formatCents } from '../lib/api'

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const { clearCart } = useCart()
  const orderId = params.get('orderId') || ''
  const sessionId = params.get('session_id') || ''

  const [status, setStatus] = useState('loading')
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function confirm() {
      if (!orderId || !sessionId) {
        setStatus('error')
        setMessage('Missing payment details. If you were charged, contact support with your order email.')
        return
      }

      try {
        const result = await api.post('/api/payments/confirm-session', {
          orderId,
          sessionId,
        })

        if (!active) return

        if (result.paid) {
          clearCart()
          setOrder(result.order)
          setStatus('success')
          return
        }

        setStatus('error')
        setMessage('Payment is still processing. Refresh this page in a moment, or check your orders.')
      } catch (err) {
        if (!active) return
        setStatus('error')
        setMessage(err.message || 'Could not confirm payment.')
      }
    }

    confirm()
    return () => {
      active = false
    }
  }, [orderId, sessionId, clearCart])

  return (
    <PageTransition>
      <PageHeader />
      <main className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-xl px-5 text-center md:px-8">
          {status === 'loading' ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan" strokeWidth={1.6} />
              <p className="mt-5 text-sm text-muted">Confirming your payment with Stripe…</p>
            </>
          ) : null}

          {status === 'success' && order ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-cyan" strokeWidth={1.6} />
              <h2 className="mt-5 font-display text-2xl font-bold text-ink">
                Order {order.orderNumber} paid
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                A confirmation email is on its way. You will receive tracking as soon as the label is
                created.
              </p>
              <p className="mt-4 font-display text-xl font-bold text-ink">
                {formatCents(order.totalCents)}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to={`/dashboard/orders/${order.id}`}
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
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <XCircle className="mx-auto h-14 w-14 text-rose-500" strokeWidth={1.6} />
              <h2 className="mt-5 font-display text-2xl font-bold text-ink">Could not confirm payment</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {orderId ? (
                  <Link
                    to={`/dashboard/orders/${orderId}`}
                    className="rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
                  >
                    View order
                  </Link>
                ) : null}
                <Link
                  to="/checkout"
                  className="rounded-xl bg-fog px-6 py-3 text-sm font-semibold text-ink transition hover:bg-fog-deep"
                >
                  Back to checkout
                </Link>
              </div>
            </>
          ) : null}

          <p className="mt-8 text-[11px] text-muted">
            For Research Use Only; Not for Human Consumption.
          </p>
        </div>
      </main>
      <Footer />
    </PageTransition>
  )
}
