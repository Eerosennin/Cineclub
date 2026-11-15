import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' para a app funcionar em qualquer subpasta (ex.: GitHub Pages /<repo>/)
export default defineConfig({
  plugins: [vue()],
  base: './',
})
