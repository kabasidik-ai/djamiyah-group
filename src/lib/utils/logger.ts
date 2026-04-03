// ============================================================
// Logger — debug clair en dev, silencieux en prod
// ============================================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  const formatted = `${prefix} ${message}${ctx}`

  if (level === 'error') console.error(formatted)
  else if (level === 'warn') console.warn(formatted)
  else if (process.env.NODE_ENV !== 'production' || level !== 'debug') console.log(formatted)
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
}
