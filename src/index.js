const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const auth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimit');
const corsMiddleware = require('./middleware/cors');
const validate = require('./middleware/validate');
const queryRouter = require('./routes/query');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(rateLimiter);
app.use(morgan('short'));

app.use('/api', auth, validate, queryRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(config.port, () => {
  console.log(`DB Proxy running on port ${config.port}`);
});
