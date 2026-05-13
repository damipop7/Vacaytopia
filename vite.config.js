import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    include: ['src/tests/**/*.test.{js,ts}'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@stripe/'))      return 'vendor-stripe'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-map'
          if (id.includes('react-globe'))   return 'vendor-globe'
          if (id.includes('@sentry/'))      return 'vendor-sentry'
          if (id.includes('@supabase/'))    return 'vendor-supabase'
          if (id.includes('@tanstack/'))    return 'vendor-query'
          if (id.includes('react-dom') || id.includes('react-router') || (id.includes('node_modules/react/') || id.includes('node_modules/react\\'))) return 'vendor-react'
        },
      },
    },
  },
})
