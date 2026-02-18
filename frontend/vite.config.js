import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // แยก vendor libraries ออกมาเป็น chunk แยก
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-hot-toast', 'react-big-calendar', 'lucide-react'],
          'vendor-utils': ['axios', 'date-fns', 'zod', 'react-hook-form'],
          'vendor-export': ['jspdf', 'html2canvas', 'xlsx'],
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
})
