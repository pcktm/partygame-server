import {Server} from 'colyseus';
import {createServer} from 'http';
import express from 'express';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {monitor} from '@colyseus/monitor';
import cors from 'cors';
import {GameRoom} from './rooms/GameRoom';
import {index} from './routes';

const port = Number(process.env.port) || 4000;

const app = express();
const server = createServer(app);

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

console.log(`Listening on http://localhost:${port}`);
