const winston = require('winston');
const path    = require('path');

// Levels (most to least severe): error, warn, info, http, debug
// LOG_LEVEL=http shows error+warn+info+http. LOG_LEVEL=debug shows everything.
const level = process.env.LOG_LEVEL || 'http';

// 1. Always include Console for stdout (cloud-native logging)
const transports = [
  new winston.transports.Console()
];

// 2. Conditionally add File transports unless explicitly disabled (e.g. for AWS Week 10)
if (process.env.LOG_TO_FILE !== 'false') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'combined.log'),
      maxsize: 5 * 1024 * 1024, // 5MB limit per file
      maxFiles: 3               // Keep a maximum of 3 archived files
    })
  );
}

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports
});

module.exports = logger;