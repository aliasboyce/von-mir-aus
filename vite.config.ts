import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Binds the dev server to all network interfaces (not just localhost),
    // so it's reachable from other devices on the same WiFi — e.g. opening
    // http://<your-computer's-local-IP>:5173 on a phone. `npm run dev`
    // prints this exact URL under "Network:" once the server starts.
    host: true,
  },
})
