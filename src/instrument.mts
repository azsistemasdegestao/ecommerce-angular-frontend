import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const serviceName = process.env['OTEL_SERVICE_NAME'] ?? 'ecommerce-frontend';
const jaegerEndpoint = process.env['JAEGER_ENDPOINT'] ?? 'http://localhost:4317';

const prometheusExporter = new PrometheusExporter({ preventServerStart: true });

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
  traceExporter: new OTLPTraceExporter({ url: jaegerEndpoint }),
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Angular SSR reads compiled template files on every cold render —
      // fs tracing generates massive span volume with no diagnostic value.
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
