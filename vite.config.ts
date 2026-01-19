import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // ✅ MUST match subfolder deployment
    base: '/crm/',

    plugins: [react()],

    build: {
      outDir: 'dist',
      emptyOutDir: true
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    define: {
      __GEMINI_API_KEY__: JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }
})
