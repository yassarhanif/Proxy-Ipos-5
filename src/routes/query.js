const express = require('express');
const pool = require('../db');
const { isReadOnlyQuery, injectLimit } = require('../utils/sanitize');
const { logRequest } = require('../utils/logger');

const router = express.Router();

router.post('/query', async (req, res) => {
  const start = Date.now();
  const { sql, params } = req.body;

  if (!isReadOnlyQuery(sql)) {
    logRequest(req, 403, Date.now() - start);
    return res.status(403).json({ success: false, error: 'Read only: SELECT queries only' });
  }

  const { sql: safeSql, truncated: limitInjected } = injectLimit(sql);

  try {
    const result = await pool.query(safeSql, params);
    const duration = Date.now() - start;
    logRequest(req, 200, duration);

    const exceededLimit = result.rows.length > 1000;
    const rows = result.rows.slice(0, 1000);
    const response = {
      success: true,
      rows,
      rowCount: rows.length,
      duration: `${duration}ms`,
    };

    if (limitInjected || exceededLimit) {
      response.truncated = true;
    }

    return res.json(response);
  } catch (err) {
    const duration = Date.now() - start;

    if (err.code === 'ETIMEOUT' || err.message?.includes('timeout')) {
      logRequest(req, 408, duration);
      return res.status(408).json({ success: false, error: 'Request timeout' });
    }

    logRequest(req, 500, duration);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
