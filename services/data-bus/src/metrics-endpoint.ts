import { createServer } from 'http';
import { register } from 'prom-client';
import { logger } from '@baskt/shared';

/**
 * Creates a simple HTTP server to expose Prometheus metrics
 * This should be included in each service that uses metrics
 */
export function createMetricsServer(port: number = 9090): void {
  const server = createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } else if (req.url === '/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    logger.info(`Metrics server listening on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      logger.info('Metrics server closed');
    });
  });
}