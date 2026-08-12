import { Link, useSearchParams } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'

export default function CheckoutCancelPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId') || ''

  return (
    <PageTransition>
      <PageHeader />
      <main className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-xl px-5 text-center md:px-8">
          <XCircle className="mx-auto h-14 w-14 text-rose-500" strokeWidth={1.6} />
          <h2 className="mt-5 font-display text-2xl font-bold text-ink">Checkout was cancelled</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You left Stripe Checkout before paying. You can try again from your order, or continue
            shopping. The order stays reserved until you complete payment or cancel it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {orderId ? (
              <Link
                to={`/dashboard/orders/${orderId}`}
                className="rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
              >
                Complete payment
              </Link>
            ) : (
              <Link
                to="/checkout"
                className="rounded-xl bg-cyan px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-110"
              >
                Return to checkout
              </Link>
            )}
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
