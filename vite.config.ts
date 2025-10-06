import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'ifc-ts': path.resolve(__dirname, '../ifc-ts/src')
    }
  }
})