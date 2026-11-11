import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Lets you write `import Foo from '@/features/...'` anywhere in src/
      '@': path.resolve(__dirname, './src'),
    },
  },
})
