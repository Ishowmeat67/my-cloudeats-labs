const morgan = require('morgan');
const logger = require('./logger');

// Send Morgan's one-line-per-request output into Winston at level "http"
const stream = { write: (message) => logger.http(message.trim()) };

module.exports = morgan(':method :url :status :res[content-length] - :response-time ms', { stream });