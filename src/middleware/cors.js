const cors = require('cors');
const config = require('../config');

const corsOptions = {
  origin: config.corsOrigins.includes('*')
    ? '*'
    : config.corsOrigins,
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
};

module.exports = cors(corsOptions);
