"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colyseus_1 = require("colyseus");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const ws_transport_1 = require("@colyseus/ws-transport");
const GameRoom_1 = require("./rooms/GameRoom");
const monitor_1 = require("@colyseus/monitor");
const port = Number(process.env.port) || 4000;
const app = express_1.default();
const server = http_1.createServer(app);
app.use(express_1.default.json());
app.use("/colyseus", monitor_1.monitor());
const gameServer = new colyseus_1.Server({
    // todo: migrate to uWebSockets.js for performance reasons
    transport: new ws_transport_1.WebSocketTransport({
        server
    })
});
gameServer.define('game_room', GameRoom_1.GameRoom);
gameServer.listen(port);
