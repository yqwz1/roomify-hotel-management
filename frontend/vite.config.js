import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],

  define: {
    global: 'globalThis',
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react') || id.includes('react-router-dom')) return 'vendor-react';
          if (id.includes('framer-motion') || id.includes('lenis')) return 'vendor-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('i18next') || id.includes('date-fns')) return 'vendor-i18n';
          if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'vendor-ui';
          return undefined;
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})
