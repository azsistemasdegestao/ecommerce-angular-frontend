import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { register } from 'prom-client';
import { logger } from './logger.js';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Forwards browser OTel spans (OTLP/HTTP) to Jaeger on the internal Docker
// network — avoids exposing Jaeger's port publicly or dealing with CORS.
app.post(
  '/api/traces',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    const jaegerHttp =
      process.env['JAEGER_OTLP_HTTP_ENDPOINT'] ?? 'http://localhost:4318';
    try {
      const upstream = await fetch(`${jaegerHttp}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type':
            (req.headers['content-type'] as string) ?? 'application/json',
        },
        body: req.body as unknown as BodyInit,
      });
      res.status(upstream.status).end();
    } catch {
      res.status(502).end();
    }
  },
);

/**
 * Exposes the API_BASE_URL configured for this container so the browser
 * bundle can target the right backend at runtime (see AuthInterceptor /
 * ApiConfiguration bootstrap in app.config.ts).
 */
app.get('/api/config', (_req, res) => {
  res.json({ apiBaseUrl: process.env['API_BASE_URL'] ?? '' });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    logger.info({ port }, `Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
