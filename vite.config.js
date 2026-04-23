import { resolve, dirname } from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        designs: resolve(__dirname, 'designs.html'),
        blog: resolve(__dirname, 'blog.html'),
        about: resolve(__dirname, 'about.html'),
        blog1: resolve(__dirname, 'guide-to-kitchen-laminates-2026.html'),
        blog2: resolve(__dirname, 'save-budget-custom-cabinets.html'),
        blog3: resolve(__dirname, 'why-handleless-kitchens-trending.html'),
        blog4: resolve(__dirname, 'open-vs-closed-kitchens.html'),
      },
    },
  },
})
