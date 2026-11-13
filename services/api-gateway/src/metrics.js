const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });   // CPU, memory, event loop lag of the gateway

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Requests through the gateway',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration through the gateway',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register]
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Requests currently being handled',
  registers: [register]
});

const logins = new client.Counter({
  name: 'cloudeats_logins_total',
  help: 'Login attempts by outcome',
  labelNames: ['outcome'],
  registers: [register]
});

const registrations = new client.Counter({
  name: 'cloudeats_registrations_total',
  help: 'Registration attempts by outcome',
  labelNames: ['outcome'],
  registers: [register]
});

// /api/users/42 and /api/users/43 must be ONE label, or memory grows forever
function routeLabel(req) {
  const parts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
  return '/' + parts.slice(0, 2).join('/');
}

function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  activeRequests.inc();
  res.on('finish', () => {
    const route = routeLabel(req);
    activeRequests.dec();
    end({ method: req.method, route });
    httpRequests.inc({ method: req.method, route, status: res.statusCode });

    // Business metrics: read the outcome from the response status
    if (req.method === 'POST' && route === '/api/auth') {
      const path = req.originalUrl.split('?')[0];
      if (path === '/api/auth/login') logins.inc({ outcome: res.statusCode === 200 ? 'success' : 'failure' });
      if (path === '/api/auth/register') registrations.inc({ outcome: res.statusCode === 201 ? 'success' : 'failure' });
    }
  });
  next();
}

module.exports = { register, metricsMiddleware };