import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_API_URL

  return {
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
  }
})
