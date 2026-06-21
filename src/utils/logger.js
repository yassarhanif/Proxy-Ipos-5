const fs = require('fs');
const path = require('path');
const config = require('../config');

const logFile = path.resolve(config.logFile);

function appendLog(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(logFile, line, (err) => {
    if (err) console.error('Log write error:', err.message);
  });
}

function maskApiKey(key) {
  if (!key || key.length < 4) return '***';
  return key.slice(0, 2) + '***' + key.slice(-2);
}

function logRequest(req, statusCode, durationMs) {
  const sql = req.body?.sql || '';
  const truncatedSql = sql.length > 100 ? sql.slice(0, 100) + '...' : sql;
  appendLog({
    timestamp: new Date().toISOString(),
    apiKey: maskApiKey(req.headers['x-api-key'] || ''),
    endpoint: req.originalUrl,
    method: req.method,
    query: truncatedSql,
    statusCode,
    duration: `${durationMs}ms`,
  });
}

module.exports = { appendLog, logRequest };
