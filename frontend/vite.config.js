import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // 0.0.0.0 → konteýnerden / başga enjamdan elýeterli
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      // All /University_system/v1/* requests are forwarded to the local backend.
      // This means clients on the network hit Vite
      // and Vite forwards to localhost:8000 — no IP mismatch, no CORS issue.
      '/University_system/v1': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/University_system/v1': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,

    /* ── Vendor splitting (AUDIT F1/F28) ─────────────────────────
       Öň: 996 kB ýeke `index.js` → ilkinji açylyşda hemmesi ýüklenýärdi.
       Indi: framework / UI kit / agyr kitaphanalar aýratyn chunk-larda,
       şonuň üçin olar uzak möhletli keşde galýar we diňe üýtgän
       programma kody täzeden ýüklenýär.
       Sahypa chunk-lary `config/routes.jsx`-däki `lazy()` bilen
       awtomatiki bölünýär. */
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Firebase iň agyr baglylyk (~300 kB) — diňe FCM gerek bolanda
          if (id.includes('/firebase/') || id.includes('@firebase')) return 'vendor-firebase';
          if (id.includes('html5-qrcode') || id.includes('qrcode.react')) return 'vendor-qr';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('axios') || id.includes('jwt-decode')) return 'vendor-http';

          return 'vendor';
        },
      },
    },
  },

  /* `@` → `src` (import ýollaryny gysgaltmak üçin) */
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
