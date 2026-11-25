import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Structured JSON in production — ship to log aggregator
        formatters: {
          level(label: string) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
  // Redact secrets from log output
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      '*.api_key',
      '*.serviceRoleKey',
      '*.DATABASE_URL',
      '*.DIRECT_URL',
    ],
    censor: '[REDACTED]',
  },
});

export default logger;
