const isDev = import.meta.env.DEV

type LogLevel = 'log' | 'warn' | 'error'

function sendToServer(level: LogLevel, args: any[]) {
  if (!isDev) return

  try {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')

    // Send to server via beacon (doesn't block, works even on page unload)
    navigator.sendBeacon('/__dev_log__', JSON.stringify({ level, message, timestamp: new Date().toISOString() }))
  } catch (e) {
    // Fail silently to avoid infinite loops
  }
}

export function setupLogger() {
  if (!isDev) return

  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = function(...args: any[]) {
    originalLog.apply(console, args)
    sendToServer('log', args)
  }

  console.warn = function(...args: any[]) {
    originalWarn.apply(console, args)
    sendToServer('warn', args)
  }

  console.error = function(...args: any[]) {
    originalError.apply(console, args)
    sendToServer('error', args)
  }

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    console.error(`Uncaught Error: ${event.message}`, event.error)
  })

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error(`Unhandled Promise Rejection:`, event.reason)
  })
}
