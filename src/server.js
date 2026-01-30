import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';

const { port, host } = config.server;

app.listen(port, host, () => {
  logger.info('='.repeat(50));
  logger.info('Cursor Usage Automation Server Started');
  logger.info('='.repeat(50));
  logger.info(`Server running at http://${host}:${port}`);
  logger.info(`API endpoints:`);
  logger.info(`  - GET    /api/health`);
  logger.info(`  - GET    /api/accounts`);
  logger.info(`  - POST   /api/accounts`);
  logger.info(`  - GET    /api/accounts/:id`);
  logger.info(`  - DELETE /api/accounts/:id`);
  logger.info(`  - POST   /api/accounts/:id/open-browser`);
  logger.info(`  - POST   /api/accounts/:id/verify`);
  logger.info(`  - POST   /api/accounts/:id/download`);
  logger.info(`  - POST   /api/automation/run-all`);
  logger.info(`  - GET    /api/automation/status`);
  logger.info('='.repeat(50));
  logger.info('Paths:');
  logger.info(`  - Profiles: ${config.paths.profiles}`);
  logger.info(`  - Download: ${config.paths.download}`);
  logger.info(`  - Logs: ${config.paths.logs}`);
  logger.info('='.repeat(50));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});
