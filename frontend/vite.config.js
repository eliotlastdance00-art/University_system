import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // All /api/* requests are forwarded to the local backend.
      // This means clients on the network hit Vite (199.40.7.75:5173)
      // and Vite forwards to localhost:8000 — no IP mismatch, no CORS issue.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/University_system/v1'),
      },
    },
  },
})
