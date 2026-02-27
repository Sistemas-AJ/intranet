import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// backend URL is configurable via environment. default to localhost:3000
const backend = process.env.VITE_API_URL || 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward any /api requests to the backend server
      '/api': {
        target: backend,
        changeOrigin: true,
        rewrite: (path) => path, // keep same path
      },
      // optionally proxy uploads or clientes if still used
    },
  },
})
