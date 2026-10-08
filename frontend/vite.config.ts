import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7173,
    host: true,
  },
  preview: {
    port: 7173,
    host: true,
  },
})
