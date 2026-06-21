const MAX_PARAMS = 20;

function validate(req, res, next) {
  const { sql, params } = req.body;

  if (typeof sql !== 'string' || sql.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'sql must be a non-empty string' });
  }

  if (!Array.isArray(params)) {
    return res.status(400).json({ success: false, error: 'params must be an array' });
  }

  if (params.length > MAX_PARAMS) {
    return res.status(400).json({ success: false, error: `params exceeds max of ${MAX_PARAMS} parameters` });
  }

  next();
}

module.exports = validate;
