import pino from 'pino';

const lokiUrl = process.env['LOKI_URL'] ?? 'http://localhost:3100';
const isDev = process.env['NODE_ENV'] !== 'production';

const targets: pino.TransportTargetOptions[] = [
  {
    target: 'pino-loki',
    options: {
      host: lokiUrl,
      labels: { app: 'ecommerce-frontend' },
      batching: true,
      interval: 5,
    },
    level: 'info',
  },
];

if (isDev) {
  targets.push({
    target: 'pino-pretty',
    options: { colorize: true },
    level: 'debug',
  });
}

export const logger = pino(
  { level: isDev ? 'debug' : 'info' },
  pino.transport({ targets }),
);

export type { Logger } from 'pino';
