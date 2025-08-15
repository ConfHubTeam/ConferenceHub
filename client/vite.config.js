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
        // Remove the rewrite to keep the /api prefix
      }
    },
    allowedHosts: [
      'localhost'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure CSS is processed correctly
    cssCodeSplit: true,
    // Set the correct MIME types during build
    rollupOptions: {
      output: {
        // Organize output files by type for better organization and correct content-type handling
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Group assets by file type
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          // Images
          if (assetInfo.name.match(/\.(png|jpe?g|gif|svg|webp)$/)) {
            return 'assets/img/[name]-[hash][extname]';
          }
          
          // Fonts
          if (assetInfo.name.match(/\.(woff2?|eot|ttf|otf)$/)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          // Other assets
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
