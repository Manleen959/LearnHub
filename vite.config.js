import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom Vite plugin to serve /api/generate-quiz during standard local dev
function apiMiddlewarePlugin() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/generate-quiz') || req.url.startsWith('/api/ai-assist'))) {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              if (body) {
                req.body = JSON.parse(body)
              }
            } catch (e) {
              req.body = {}
            }

            res.status = function(code) {
              this.statusCode = code
              return this
            }
            res.json = function(data) {
              this.setHeader('Content-Type', 'application/json')
              this.end(JSON.stringify(data))
              return this
            }

            try {
              if (req.url.startsWith('/api/ai-assist')) {
                const { default: handler } = await import('./api/ai-assist.js')
                await handler(req, res)
              } else {
                const { default: handler } = await import('./api/generate-quiz.js')
                await handler(req, res)
              }
            } catch (err) {
              console.error('API middleware error:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.NVIDIA_API_KEY = env.NVIDIA_API_KEY
  process.env.NVIDIA_MODEL = env.NVIDIA_MODEL
  process.env.VITE_FIREBASE_API_KEY = env.VITE_FIREBASE_API_KEY
  process.env.FIREBASE_API_KEY = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiMiddlewarePlugin(),
    ],
  }
})
