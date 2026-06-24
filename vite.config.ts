import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devLogPlugin = {
  name: 'dev-log',
  configureServer(server: any) {
    return () => {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/__dev_log__' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => { body += chunk.toString() })
          req.on('end', () => {
            try {
              const { level, message, timestamp } = JSON.parse(body)
              const levelColor = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m'
              const reset = '\x1b[0m'
              console.log(`${levelColor}[${level.toUpperCase()}]${reset} ${timestamp} ${message}`)
            } catch (e) {
              // Ignore parse errors
            }
            res.writeHead(204)
            res.end()
          })
          return
        }
        next()
      })
    }
  },
}

export default defineConfig({
  plugins: [react(), devLogPlugin],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
