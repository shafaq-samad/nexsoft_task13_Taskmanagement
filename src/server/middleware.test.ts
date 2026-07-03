import express from 'express';
import { AddressInfo } from 'net';
import { corsMiddleware } from './middleware';

describe('corsMiddleware', () => {
  it('returns CORS headers for allowed origins and handles preflight requests', async () => {
    const app = express();
    app.use(corsMiddleware);
    app.get('/health', (_req, res) => {
      res.json({ ok: true });
    });

    const server = app.listen(0);

    try {
      const address = server.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const response = await fetch(`${baseUrl}/health`, {
        headers: {
          Origin: 'https://task-management-theta-six.vercel.app',
        },
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('https://task-management-theta-six.vercel.app');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');

      const preflight = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://task-management-theta-six.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type, authorization',
        },
      });

      expect(preflight.status).toBe(204);
      expect(preflight.headers.get('access-control-allow-origin')).toBe('https://task-management-theta-six.vercel.app');
      expect(preflight.headers.get('access-control-allow-methods')).toContain('POST');
      expect(preflight.headers.get('access-control-allow-headers')).toContain('authorization');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
