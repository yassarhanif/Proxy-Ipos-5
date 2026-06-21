require('dotenv').config();

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'API_KEYS'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  apiKeys: process.env.API_KEYS.split(',').map(k => k.trim()),
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : ['*'],
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 60,
  logFile: process.env.LOG_FILE || 'server.log',
  logLevel: process.env.LOG_LEVEL || 'info',
};
