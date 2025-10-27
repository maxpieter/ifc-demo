import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  base: mode === 'gh-pages' ? '/ifc-ts-demo/' : '/',
  plugins: [react()],
}))
