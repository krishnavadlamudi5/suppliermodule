import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const shared = fileURLToPath(new URL('../shared/src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Business rules and data model shared with the backend
    alias: { '@shared': shared },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Allow Vite to serve ../shared during development
    fs: { allow: ['..'] },
    // In development the API runs separately (backend/); proxy /api to it
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8787' },
  },
})
