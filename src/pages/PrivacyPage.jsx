import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    title: 'What data we collect',
    body: `When you create a Vacaytopia account we collect your name, email address, and password (hashed — never stored in plain text). When you take the interest quiz we store your answers to power your personalised recommendations. When you make a booking we collect your contact details and store a reference to your Stripe payment — we never see or store your full card number. When you browse we optionally track which experiences you view and save, solely to improve your recommendations.`,
  },
  {
    title: 'How we use your data',
    body: `We use your data to: show you personalised experience recommendations, process your bookings and send confirmation emails, improve the Vacaytopia platform, and communicate with you about your account. We do not use your data for advertising to third parties, we do not build advertising profiles, and we never sell your data to anyone — ever.`,
  },
  {
    title: 'Who we share data with',
    body: `We share only what is necessary with trusted service providers: Supabase (database and authentication — data stored in US East), Stripe (payment processing — they handle all card data under PCI-DSS compliance), and Vercel (hosting). All providers are contractually required to protect your data and may not use it for their own purposes.`,
  },
  {
    title: 'Your rights (GDPR)',
    body: `You have the right to: access all data we hold about you (request via Settings → Download my data), correct inaccurate data, delete your account and all associated data (Settings → Delete account), withdraw consent for optional data processing at any time, and lodge a complaint with your local data protection authority. We will respond to all data requests within 30 days.`,
  },
  {
    title: 'Data retention',
    body: `We keep your account data for as long as your account is active. Booking records are retained for 7 years for legal and tax purposes. If you delete your account all personal data is permanently deleted within 30 days, except where retention is legally required.`,
  },
  {
    title: 'Security',
    body: `All data is transmitted over HTTPS. Your database rows are protected by Row Level Security — you can only read your own data. Passwords are hashed by Supabase Auth using bcrypt. We perform regular security reviews and keep all dependencies up to date.`,
  },
  {
    title: 'Cookies',
    body: `Vacaytopia uses a single session cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. You can clear your session at any time by signing out.`,
  },
  {
    title: 'Contact',
    body: `For any privacy questions or data requests, email privacy@vacaytopia.com. We aim to respond within 5 business days.`,
  },
]

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-blue-brand mb-8 flex items-center gap-1.5 transition-colors"
        >
          ← Back
        </button>

        <div className="mb-10">
          <div className="text-xs font-bold tracking-widest uppercase text-gold-brand mb-2">Legal</div>
          <h1 className="font-display font-black text-4xl text-[#0D1B3E] mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: April 2026 · Effective immediately</p>
        </div>

        {/* Data promise banner */}
        <div className="bg-blue-brand text-white rounded-card p-6 mb-8 flex items-center gap-4">
          <div className="text-3xl flex-shrink-0">🔒</div>
          <div>
            <div className="font-bold text-base mb-1">Our data promise</div>
            <div className="text-white/80 text-sm leading-relaxed">
              Vacaytopia will never sell your data to anyone. We collect only what is necessary
              to give you great travel recommendations. Your data belongs to you.
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-0">
          {SECTIONS.map((section, i) => (
            <div
              key={section.title}
              className="bg-white border border-blue-brand/10 p-6"
              style={{
                borderRadius: i === 0 ? '14px 14px 0 0' : i === SECTIONS.length - 1 ? '0 0 14px 14px' : '0',
                borderTopWidth: i === 0 ? '1.5px' : '0',
                borderBottomWidth: '1.5px',
              }}
            >
              <h2 className="font-display font-bold text-lg text-[#0D1B3E] mb-3">
                {i + 1}. {section.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-blue-tint rounded-card border border-blue-brand/15 text-center">
          <div className="text-sm text-gray-500 mb-3">
            Questions about this policy? We're here to help.
          </div>
          <a
            href="mailto:privacy@vacaytopia.com"
            className="btn-primary text-sm inline-block"
          >
            Contact Privacy Team
          </a>
        </div>
      </div>
    </div>
  )
}
