import pino from 'pino'

export const Logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  nestedKey: 'payload',
  redact: {
    paths: [
      'event.headers.Authorization',
      'event.multiValueHeaders.Authorization',
      'headers.Authorization',
      'multiValueHeaders.Authorization',
    ],
  },
  serializers: { error: pino.stdSerializers.err }
})
