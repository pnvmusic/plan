import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages project sites, set base to '/<repo-name>/'.
// Override at build time:  VITE_BASE=/your-repo/ npm run build
// For a custom domain or user/org page, leave it as '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: {
    proxy: {
      '/apple-calendar.ics': {
        target: 'https://p129-caldav.icloud.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/published/2/MTc1NTEzMTY5ODE3NTUxM_2dw8_1BkJgNEBvh56HLbqsyLJYlQBTlWkm9tkEsWWwlkDS9TfzDfvj3j98LYpxixvQzOXbiKsYwDIHyJSS8NI',
      },
    },
  },
})
