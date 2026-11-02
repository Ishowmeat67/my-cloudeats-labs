const winston = require('winston');
const path    = require('path');

// Levels (most to least severe): error, warn, info, http, debug
// LOG_LEVEL=http shows error+warn+info+http. LOG_LEVEL=debug shows everything.
const level = process.env.LOG_LEVEL || 'http';

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    // 1. stdout — what `docker compose logs` reads (the cloud-native way)
    new winston.transports.Console(),
    // 2. files in /app/logs — kept by a named volume (see docker-compose.yml)
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'combined.log')
    })
  ]
});

module.exports = logger;