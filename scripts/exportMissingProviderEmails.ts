/**
 * Lists active experiences with requires_booking=true that have no provider_email.
 * These are the only ones where a Stripe payment can fire and the operator
 * notification email actually matters. Discovery-only experiences (requires_booking=false)
 * are excluded — they never trigger the webhook.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/exportMissingProviderEmails.ts > missing-emails.csv
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const { data, error } = await supabase
  .from('experiences')
  .select('id, title, category, experience_type, external_url, provider_email')
  .eq('is_active', true)
  .eq('requires_booking', true)
  .or('provider_email.is.null,provider_email.eq.')
  .order('title')

if (error) {
  console.error('Query failed:', error.message)
  process.exit(1)
}

if (!data || data.length === 0) {
  console.error('All bookable experiences already have a provider_email — nothing to do.')
  process.exit(0)
}

const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`

console.log('id,title,category,experience_type,external_url,provider_email')
for (const row of data) {
  console.log([row.id, row.title, row.category, row.experience_type, row.external_url, row.provider_email].map(escape).join(','))
}

console.error(`\nExported ${data.length} bookable experience(s) missing provider_email.`)
console.error('These are the only ones where a Stripe payment fires and the operator email matters.')
console.error('Fill provider_email, then update via Supabase dashboard → Table Editor, or bulk UPDATE by id.')
