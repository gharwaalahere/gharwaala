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
        contact: resolve(__dirname, 'contact.html'),
        designs: resolve(__dirname, 'designs.html'),
        blog: resolve(__dirname, 'blog.html'),
        about: resolve(__dirname, 'about.html'),
        blog1: resolve(__dirname, 'guide-to-kitchen-laminates-2026.html'),
        blog2: resolve(__dirname, 'save-budget-custom-cabinets.html'),
        blog3: resolve(__dirname, 'why-handleless-kitchens-trending.html'),
        blog4: resolve(__dirname, 'open-vs-closed-kitchens.html'),
        city1: resolve(__dirname, 'modular-kitchen-delhi.html'),
        city2: resolve(__dirname, 'modular-kitchen-noida.html'),
        city3: resolve(__dirname, 'modular-kitchen-gurugram.html'),
        city4: resolve(__dirname, 'modular-kitchen-faridabad.html'),
        city5: resolve(__dirname, 'modular-kitchen-ghaziabad.html'),
        post5: resolve(__dirname, 'modular-kitchen-cost-delhi-ncr-2026.html'),
      },
    },
  },
})
