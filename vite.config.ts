import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

// "Update-Benachrichtigung fuer Nutzer"-Auftrag — a fresh build id is
// generated once per build and written to both the JS bundle (via
// `define`, so the running app knows what version IT is) and to
// public/version.json (so the running app can periodically re-fetch
// that file — vercel.json marks it no-cache, closing a gap where that
// rule was missing before and Vercel's CDN could briefly serve a
// stale copy right after a deploy — and compare
// against its own id to notice a newer deploy exists).
const buildId = String(Date.now())

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'write-build-version',
      buildStart() {
        writeFileSync('public/version.json', JSON.stringify({ buildId }))
      },
    },
  ],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    // Binds the dev server to all network interfaces (not just localhost),
    // so it's reachable from other devices on the same WiFi — e.g. opening
    // http://<your-computer's-local-IP>:5173 on a phone. `npm run dev`
    // prints this exact URL under "Network:" once the server starts.
    host: true,
  },
})
