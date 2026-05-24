import path from "path"
import { fileURLToPath } from "url"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET?.trim()

  return {
    plugins: [react()],

    define: {
      global: 'globalThis',
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    },

    server: {
      port: 3000,
      ...(devProxyTarget
        ? {
            proxy: {
              '/api': {
                target: devProxyTarget,
                changeOrigin: true,
                secure: false,
              },
              '/ws': {
                target: devProxyTarget,
                changeOrigin: true,
                secure: false,
                ws: true,
              },
            },
          }
        : {}),
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
    },
  }
})
