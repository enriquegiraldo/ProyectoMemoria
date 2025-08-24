import NotificationsServer from './server';
import { logger } from './utils';

async function main() {
  try {
    logger.info('Starting Notifications Service...');
    
    const server = new NotificationsServer();
    await server.start();
    
    logger.info('Notifications Service started successfully');
  } catch (error) {
    logger.error('Failed to start Notifications Service', { error: error.message });
    process.exit(1);
  }
}

// Start the service
main();
