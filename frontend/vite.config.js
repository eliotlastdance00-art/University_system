import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // All /University_system/v1/* requests are forwarded to the local backend.
      // This means clients on the network hit Vite
      // and Vite forwards to localhost:8000 — no IP mismatch, no CORS issue.
      '/University_system/v1': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
