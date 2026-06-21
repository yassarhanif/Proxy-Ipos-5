const config = require('../config');

function auth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !config.apiKeys.includes(key)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: invalid or missing API key' });
  }
  next();
}

module.exports = auth;
