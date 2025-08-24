import { DataSource } from 'typeorm';
import config from '../config';
import { Payment, Subscription, Customer } from '../models';
import { logger } from '../utils';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  synchronize: config.server.environment === 'development',
  logging: config.server.environment === 'development',
  entities: [Payment, Subscription, Customer],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  poolSize: 10,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
    
    // Test the connection
    await AppDataSource.query('SELECT 1');
    logger.info('Database connection test successful');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export const getRepository = <T>(entity: new () => T) => {
  return AppDataSource.getRepository(entity);
};
