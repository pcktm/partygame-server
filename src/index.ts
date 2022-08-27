import {Server} from 'colyseus';
import {createServer} from 'http';
import express from 'express';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {monitor} from '@colyseus/monitor';
import cors from 'cors';
import dotenv from 'dotenv';
import {GameRoom} from './rooms/GameRoom';
import {index} from './routes';
import {httpLogger, logger} from './utils/loggers';

dotenv.config();
const port = Number(process.env.PORT) || 4000;

const app = express();
const server = createServer(app);
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

app.use(httpLogger());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
}));
app.use(express.json());

app.use('/colyseus', monitor());
app.use('/', index);

const gameServer = new Server({
  // todo: migrate to uWebSockets.js for performance reasons
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('game_room', GameRoom);

gameServer.listen(port);

logger.info({
  port,
  environment: process.env.NODE_ENV,
  version: process.env.npm_package_version ?? 'unavailable',
}, 'server started');
