import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    allowedHosts: [
      'localhost',
      '49ff-90-156-166-124.ngrok-free.app'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
