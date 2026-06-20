import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages project sites, set base to '/<repo-name>/'.
// Override at build time:  VITE_BASE=/your-repo/ npm run build
// For a custom domain or user/org page, leave it as '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
