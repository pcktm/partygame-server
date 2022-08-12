import {Server} from 'colyseus';
import {createServer} from 'http';
import express from 'express';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {monitor} from '@colyseus/monitor';
import {GameRoom} from './rooms/GameRoom';

const port = Number(process.env.port) || 4000;

const app = express();
const server = createServer(app);

app.use(express.json());
app.use('/colyseus', monitor());

const gameServer = new Server({
  // todo: migrate to uWebSockets.js for performance reasons
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('game_room', GameRoom);

gameServer.listen(port);
