/**
 * Lists all active experiences that have no provider_email set.
 * Outputs a CSV to stdout so you can open it in a spreadsheet,
 * fill in the email column, and paste values back into Supabase.
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
  .select('id, title, category, website_url, provider_email')
  .eq('is_active', true)
  .or('provider_email.is.null,provider_email.eq.')
  .order('title')

if (error) {
  console.error('Query failed:', error.message)
  process.exit(1)
}

if (!data || data.length === 0) {
  console.error('All active experiences already have a provider_email — nothing to do.')
  process.exit(0)
}

const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`

console.log('id,title,category,website_url,provider_email')
for (const row of data) {
  console.log([row.id, row.title, row.category, row.website_url, row.provider_email].map(escape).join(','))
}

console.error(`\nExported ${data.length} active experience(s) missing provider_email.`)
console.error('Fill the provider_email column, then import back via Supabase dashboard → Table Editor → Import CSV,')
console.error('or run a bulk UPDATE using the id column.')
