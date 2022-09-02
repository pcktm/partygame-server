import {PrismaClient} from '@prisma/client';
import {logger} from './loggers';

const client = new PrismaClient();

try {
  client.$connect();
} catch (e) {
  logger.fatal(e, 'failed to connect to database');
  process.exit(1);
}

export default client;
