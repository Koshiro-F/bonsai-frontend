import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    allowedHosts: ['bonsai-backend.modur4.com', 'bonsai.modur4.com'],
    host: true,
    port: 6173,
  },
})
