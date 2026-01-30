import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import accountRoutes from './routes/account.routes.js';
import automationRoutes from './routes/automation.routes.js';
import logger from './utils/logger.js';
import config from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.debug('Incoming request', { 
    method: req.method, 
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

app.use('/api/accounts', accountRoutes);
app.use('/api/automation', automationRoutes);

app.get('/api/health', (req, res) => {
  logger.debug('Health check');
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (req, res) => {
  logger.debug('Config request');
  res.json({ 
    success: true, 
    data: {
      paths: {
        profiles: config.paths.profiles,
        download: config.paths.download,
      },
      cursor: config.cursor,
    }
  });
});

const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Resource not found' } 
      });
    }
  });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path 
  });
  res.status(500).json({ 
    success: false, 
    error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
  });
});

export default app;
