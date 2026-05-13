/**
 * Generates all missing static image assets from the existing favicon.svg:
 *   public/apple-touch-icon.png  (180×180)
 *   public/icon-512.png          (512×512)
 *   public/og-image.png          (1200×630)
 *
 * Usage:
 *   npx tsx scripts/generateAssets.ts
 *
 * Requires sharp:
 *   npm install --save-dev sharp
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT    = join(import.meta.dirname, '..')
const PUBLIC  = join(ROOT, 'public')
const SVG_SRC = readFileSync(join(PUBLIC, 'favicon.svg'))

// ── Favicon PNGs ─────────────────────────────────────────────────────────────

async function makeFaviconPng(size: number, filename: string) {
  await sharp(SVG_SRC)
    .resize(size, size)
    .png()
    .toFile(join(PUBLIC, filename))
  console.log(`✓ ${filename} (${size}×${size})`)
}

// ── OG image SVG → PNG ───────────────────────────────────────────────────────
// 1200×630 branded card: purple gradient bg, logo, tagline, URL

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0d0118"/>
      <stop offset="100%" stop-color="#1a0633"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#863bff"/>
      <stop offset="100%" stop-color="#47bfff"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="630" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="630" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>

  <!-- Glow blob -->
  <ellipse cx="600" cy="315" rx="420" ry="220" fill="#863bff" opacity="0.12"/>

  <!-- Logo mark (scaled up from 48×46 viewBox to ~120px) -->
  <g transform="translate(540, 175) scale(2.5)">
    <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
  </g>

  <!-- Wordmark -->
  <text x="600" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="-1">Vtopia</text>

  <!-- Tagline -->
  <text x="600" y="418" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" fill="#c4a8ff" text-anchor="middle" letter-spacing="0.5">Discover Kansas City · FIFA World Cup 2026</text>

  <!-- Accent bar -->
  <rect x="460" y="448" width="280" height="3" rx="2" fill="url(#accent)"/>

  <!-- URL -->
  <text x="600" y="510" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#ffffff" fill-opacity="0.45" text-anchor="middle">vtopia.world</text>
</svg>`

async function makeOgImage() {
  const svgBuf = Buffer.from(OG_SVG)
  await sharp(svgBuf)
    .resize(1200, 630)
    .png()
    .toFile(join(PUBLIC, 'og-image.png'))
  console.log('✓ og-image.png (1200×630)')
}

// ── Run ───────────────────────────────────────────────────────────────────────

await makeFaviconPng(180, 'apple-touch-icon.png')
await makeFaviconPng(512, 'icon-512.png')
await makeOgImage()

console.log('\nAll assets written to public/. Commit them with git add public/*.png')
