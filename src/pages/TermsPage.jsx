import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Vtopia ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform. These terms apply to all visitors, users, and others who access or use the Platform.`,
  },
  {
    title: '2. Description of Service',
    body: `Vtopia is a travel discovery and booking platform that helps users find, plan, and book local experiences in US cities. Vtopia acts as an intermediary between users ("Guests") and experience providers ("Providers"). Vtopia does not own, operate, or manage the experiences listed on the Platform.`,
  },
  {
    title: '3. User Accounts',
    body: `You must create an account to book experiences. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate and complete information when creating your account. You must be at least 18 years old to create an account and make bookings.`,
  },
  {
    title: '4. Bookings & Payments',
    body: `When you book an experience through Vtopia, you enter into a direct contract with the Provider. Vtopia processes payments on behalf of Providers using Stripe. By making a booking you authorise us to charge your payment method for the full amount shown at checkout. Vtopia charges a service fee (currently 15% of the experience price) which is included in the price shown. Prices are displayed in USD and include all applicable fees.`,
  },
  {
    title: '5. Cancellations & Refunds',
    body: `Cancellation policies are set by individual Providers and displayed on each experience page and at checkout. In general: cancellations made more than 24 hours before the experience start time are eligible for a full refund. Cancellations within 24 hours of the start time may not be refundable. No-shows are not eligible for refunds. To request a cancellation or refund, contact support@vtopia.world with your booking reference number. Refunds, where applicable, are processed to your original payment method within 5–10 business days.`,
  },
  {
    title: '6. Provider Responsibility',
    body: `Vtopia makes reasonable efforts to verify Providers and the accuracy of experience listings. However, Vtopia does not guarantee the quality, safety, legality, or accuracy of any experience. Providers are solely responsible for delivering the experiences as described. If an experience is cancelled by a Provider, Vtopia will issue a full refund.`,
  },
  {
    title: '7. User Conduct',
    body: `You agree not to: use the Platform for any unlawful purpose, submit false or misleading reviews, attempt to bypass payment systems or obtain refunds fraudulently, harass or harm other users or Providers, or reverse-engineer or copy any part of the Platform. Vtopia reserves the right to terminate accounts that violate these terms.`,
  },
  {
    title: '8. Intellectual Property',
    body: `All content on the Platform — including text, photos, graphics, and the Vtopia brand — is the property of Vtopia or its licensors. You may not reproduce, distribute, or create derivative works without our express written permission. User-submitted content (such as reviews) remains owned by you, but you grant Vtopia a non-exclusive licence to use it on the Platform.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, Vtopia and its officers, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or any experience booked through it. Vtopia's total liability to you for any claim shall not exceed the amount you paid for the booking giving rise to the claim.`,
  },
  {
    title: '10. Indemnification',
    body: `You agree to indemnify and hold harmless Vtopia and its officers, employees, and partners from any claims, liabilities, damages, and expenses (including reasonable legal fees) arising out of your use of the Platform, your violation of these Terms, or your violation of any rights of a third party.`,
  },
  {
    title: '11. Changes to Terms',
    body: `Vtopia reserves the right to modify these Terms at any time. We will notify you of material changes by email or by a prominent notice on the Platform. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms are governed by the laws of the State of Missouri, United States, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved exclusively in the courts of Jackson County, Missouri.`,
  },
  {
    title: '13. Contact',
    body: `For questions about these Terms, contact us at support@vtopia.world. For bookings or refund requests, include your booking reference number in your message.`,
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Helmet>
        <title>Terms of Service — Vtopia</title>
        <meta name="description" content="Vtopia Terms of Service — bookings, payments, cancellations, and user conduct." />
      </Helmet>

      <Link to="/" className="text-blue-brand text-sm hover:underline mb-8 inline-block">← Back to Vtopia</Link>

      <h1 className="font-display font-bold text-3xl text-[#0D1B3E] mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: May 2026</p>

      <div className="space-y-8">
        {SECTIONS.map(s => (
          <div key={s.title}>
            <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-2">{s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-blue-brand/10 flex gap-4 text-sm text-gray-400">
        <Link to="/privacy" className="hover:text-blue-brand transition-colors">Privacy Policy</Link>
        <a href="mailto:support@vtopia.world" className="hover:text-blue-brand transition-colors">Contact Us</a>
      </div>
    </div>
  )
}
