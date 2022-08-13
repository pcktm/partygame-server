import {nanoid} from 'nanoid';
import pino from 'pino';
import pinoHttp from 'pino-http';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level: logLevel,
});

export const httpLogger = () => pinoHttp({
  logger,
  genReqId: (res) => {
    const id = nanoid();
    res.headers['x-request-id'] = id;
    return id;
  },
  customProps: (res) => ({
    'x-request-id': res.headers['x-request-id'],
  }),
});
