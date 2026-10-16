import { resolve, dirname } from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      {
        name: 'replicate-dev-proxy',
        configureServer(server) {
          server.middlewares.use('/api/transform', async (req, res) => {
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const parsed = JSON.parse(body || '{}')
                  const token = parsed.token || process.env.REPLICATE_API_TOKEN || process.env.VITE_REPLICATE_API_TOKEN

                  if (!token) {
                    res.statusCode = 401
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Missing Replicate token. Please enter your Replicate API token.' }))
                    return
                  }

                  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      version: '76604baddc2f763d6616da07425184311d15aca7b049b4665f97da7579126de5',
                      input: {
                        image: parsed.image,
                        prompt: parsed.prompt || 'modern modular kitchen interior, luxury minimalist, 8k photo',
                        structure: parsed.structure || 'seg',
                        a_prompt: 'best quality, extremely detailed, photo, 8k, modern luxury modular kitchen interior design',
                        n_prompt: 'low quality, bad quality, sketches, blurry, deformed, watermark'
                      }
                    })
                  })

                  const prediction = await createRes.json()
                  if (prediction.error) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: prediction.error }))
                    return
                  }

                  let poll = prediction
                  while (poll.status !== 'succeeded' && poll.status !== 'failed' && poll.status !== 'canceled') {
                    await new Promise(r => setTimeout(r, 1800))
                    const check = await fetch(`https://api.replicate.com/v1/predictions/${poll.id}`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                    poll = await check.json()
                  }

                  if (poll.status === 'succeeded') {
                    const outputUrl = Array.isArray(poll.output) ? poll.output[poll.output.length - 1] : poll.output
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ output: outputUrl, status: 'succeeded' }))
                  } else {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: poll.error || 'Prediction failed' }))
                  }
                } catch (err) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
            } else {
              res.statusCode = 405
              res.end('Method Not Allowed')
            }
          })
        }
      }
    ],
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
          calculator: resolve(__dirname, 'calculator.html'),
          transform: resolve(__dirname, 'transform.html'),
        },
      },
    },
  }
})
