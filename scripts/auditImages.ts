/**
 * Audits active KC experiences for missing or placeholder images.
 * Outputs MISSING_IMAGES.md to the project root.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/auditImages.ts
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const { data, error } = await supabase
  .from('experiences')
  .select('id, title, category, experience_type, image_url, image_emoji, external_url')
  .eq('is_active', true)
  .eq('city', 'Kansas City')
  .order('category')

if (error) { console.error('Query failed:', error.message); process.exit(1) }

const missing  = (data ?? []).filter(e => !e.image_url || e.image_url.includes('placeholder') || e.image_url.includes('unsplash.com/photos/') === false && !e.image_url.startsWith('http'))
const hasImage = (data ?? []).filter(e => e.image_url && (e.image_url.includes('unsplash') || e.image_url.startsWith('http')))

const lines = [
  '# MISSING_IMAGES — Active KC Experiences',
  `> Generated ${new Date().toISOString().slice(0, 10)} · ${missing.length} missing / ${data?.length ?? 0} total active KC experiences`,
  '',
  '## How to fix',
  '1. Find a royalty-free photo on [Unsplash](https://unsplash.com) or [Pexels](https://pexels.com)',
  '2. Copy the direct image URL (right-click → Copy image address)',
  '3. Paste into Supabase dashboard → experiences table → image_url column',
  '4. Alternatively run `scripts/enrichExperiences.ts` to pull from Google Places',
  '',
  '---',
  '',
  `## Missing image_url (${missing.length})`,
  '',
  '| Title | Category | Type | Emoji | External URL |',
  '|-------|----------|------|-------|-------------|',
  ...missing.map(e =>
    `| ${e.title} | ${e.category} | ${e.experience_type ?? '—'} | ${e.image_emoji ?? '—'} | ${e.external_url ? `[link](${e.external_url})` : '—'} |`
  ),
  '',
  '---',
  '',
  `## Has image_url (${hasImage.length})`,
  '',
  '| Title | Category | Image URL |',
  '|-------|----------|-----------|',
  ...hasImage.map(e =>
    `| ${e.title} | ${e.category} | ${e.image_url} |`
  ),
]

const outPath = join(import.meta.dirname, '..', 'MISSING_IMAGES.md')
writeFileSync(outPath, lines.join('\n'))
console.log(`Written to MISSING_IMAGES.md`)
console.log(`  Missing: ${missing.length}`)
console.log(`  Has image: ${hasImage.length}`)
console.log(`  Total active KC: ${data?.length ?? 0}`)
