const http = require('http');

const BASE_URL = 'http://localhost:8000';
const ADMIN_EMAIL = 'admin@cloudeats.com';
const ADMIN_PASSWORD = 'AdminPass123';
const INTERVAL_MS = 10000;
const ERROR_THRESHOLD_PERCENT = 5;
const MIN_REQUESTS_FOR_ALERT = 20;

let authToken = null;

function loginAndStart() {
  const data = JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  
  const url = new URL(`${BASE_URL}/api/auth/login`);
  const req = http.request({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        authToken = response.token || response.accessToken;
        if (authToken) {
          console.log('Successfully authenticated as admin. Starting metrics polling...');
          setInterval(fetchMetrics, INTERVAL_MS);
          fetchMetrics();
        } else {
          console.error('Login failed: No token received in response:', body);
        }
      } catch (err) {
        console.error('Failed to parse login response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Login request error:', err.message);
  });

  req.write(data);
  req.end();
}

function fetchMetrics() {
  if (!authToken) return;

  const url = new URL(`${BASE_URL}/api/admin/metrics/json`);
  http.get({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const metrics = JSON.parse(data);
        let totalRequests = 0;
        let serverErrors = 0;

        // Parse Prometheus array format
        if (Array.isArray(metrics)) {
          const reqMetric = metrics.find(m => m.name === 'http_requests_total');
          if (reqMetric && reqMetric.values) {
            // Sum up all recorded requests
            totalRequests = reqMetric.values.reduce((sum, v) => sum + v.value, 0);
            
            // Sum up only the requests where the status label starts with '5' (e.g., 500, 503)
            serverErrors = reqMetric.values
              .filter(v => v.labels && v.labels.status && String(v.labels.status).startsWith('5'))
              .reduce((sum, v) => sum + v.value, 0);
          }
        }

        if (totalRequests === 0) {
          console.log(`[${new Date().toLocaleTimeString()}] Total: 0 | 5xx: 0 (0.00%) - No traffic`);
          return;
        }

        const errorRate = (serverErrors / totalRequests) * 100;
        console.log(`[${new Date().toLocaleTimeString()}] Total: ${totalRequests} | 5xx: ${serverErrors} (${errorRate.toFixed(2)}%)`);

        if (totalRequests >= MIN_REQUESTS_FOR_ALERT && errorRate > ERROR_THRESHOLD_PERCENT) {
          console.log(`🚨 ALERT: 5xx error rate is ${errorRate.toFixed(2)}% (Exceeds ${ERROR_THRESHOLD_PERCENT}% threshold with ${totalRequests} requests)`);
        }
      } catch (err) {
        console.error('Failed to parse metrics JSON:', err.message);
      }
    });
  }).on('error', (err) => {
    console.error('HTTP request error:', err.message);
  });
}

console.log('Authenticating monitor script...');
loginAndStart();