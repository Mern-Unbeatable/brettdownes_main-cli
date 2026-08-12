import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.VITE_API_PROXY || 'http://localhost:4000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxying keeps the session cookie same-origin during development.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
    },
  },
})
