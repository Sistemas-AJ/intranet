import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import clientesPlugin from './vite-plugin-clientes.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), clientesPlugin()],
})
