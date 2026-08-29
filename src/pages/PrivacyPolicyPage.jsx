import PageHeader from '../components/PageHeader'
import PageTransition from '../components/PageTransition'
import Footer from '../components/Footer'
import { siteContact } from '../data/site'
import Seo from '../components/Seo'
import { pageSeo } from '../data/seo'

const sections = [
  {
    title: '1. Information we collect',
    body: 'We collect information you provide when creating an account, placing an order, contacting support, or using checkout — such as name, email, phone, shipping address, and order details. Payment card data is handled by Stripe and is not stored on our servers.',
  },
  {
    title: '2. How we use information',
    body: 'We use your information to process orders, arrange shipping or pickup, send order and tracking updates, respond to inquiries, improve the site, prevent fraud, and meet legal or operational requirements.',
  },
  {
    title: '3. Cookies & device data',
    body: 'We may use cookies or similar technologies for session management, cart continuity, security, and basic analytics. You can control cookies through your browser settings; some features may not work without them.',
  },
  {
    title: '4. Sharing of information',
    body: 'We share data only as needed with service providers that help us operate — for example Stripe (payments), EasyPost / carriers (shipping labels and rates), email delivery, and hosting. We do not sell your personal information.',
  },
  {
    title: '5. Data retention',
    body: 'We retain account and order records as long as needed for operations, customer support, accounting, and legal compliance. You may request access or correction of your account details by contacting us.',
  },
  {
    title: '6. Security',
    body: 'We use reasonable administrative and technical safeguards to protect information. No method of transmission or storage is completely secure; please use a strong password and keep your login credentials private.',
  },
  {
    title: '7. Children’s privacy',
    body: 'This site is not directed to individuals under 21. We do not knowingly collect personal information from minors.',
  },
  {
    title: '8. Your choices',
    body: 'You may update profile or address details in your account, unsubscribe from marketing emails where offered, and contact us to ask questions about your data. Transactional order emails may still be sent when required to fulfill a purchase.',
  },
  {
    title: '9. Changes to this policy',
    body: 'We may update this Privacy Policy periodically. The “Last updated” date at the top of this page will change when revisions are posted.',
  },
  {
    title: '10. Contact',
    body: `Privacy questions: ${siteContact.email} · Peptide Ops Logistics, 4472 River Rd N, PMB #1020, Keizer, OR 97303`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <PageTransition>
      <Seo {...pageSeo.privacy} />
      <PageHeader />

      <main className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div data-reveal="up">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Last updated: August 2026. This policy explains what we collect and why when you browse
              or purchase from Peptide Ops Logistics.
            </p>
          </div>

          <div data-reveal-stagger data-stagger="0.06" className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl bg-fog p-6 md:p-7">
                <h2 className="font-display text-base font-bold text-ink md:text-lg">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </PageTransition>
  )
}
