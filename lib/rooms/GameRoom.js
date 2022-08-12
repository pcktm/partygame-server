"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const colyseus_1 = require("colyseus");
const nanoid_1 = require("nanoid");
const RoomState_1 = require("./schema/RoomState");
const emojis_1 = require("../utils/emojis");
const questions_1 = require("../utils/questions");
const nanoid = nanoid_1.customAlphabet('abcdefghijklmnoprstuwxyz', 6);
class GameRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.LOBBY_CHANNEL = "$epiclobby";
        this.REGULAR_WAIT_TIME = 8 * 1000;
        this.QUESTION_AMOUNT = 8;
        this.MAX_CLIENTS = 10;
        this.allQuestions = questions_1.getAllQuestions();
    }
    async onCreate(options) {
        this.roomId = await this.generateRoomId();
        this.setPrivate(true);
        this.maxClients = this.MAX_CLIENTS;
        const state = new RoomState_1.RoomState();
        state.randomQuestionQueue = this.getRandomQuestionQueue();
        this.setState(state);
        console.log(`Game room ${this.roomId} created!`);
        this.onMessage("toggleReady", (client, ready) => {
            if (this.state.screen !== "lobby")
                return;
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.isReady = ready;
            }
            // check if all players are ready and start game
            if (this.state.players.size > 1 && this.areAllPlayersReady()) {
                this.startGame();
            }
        });
        this.onMessage("submitAnswer", (client, answer) => {
            if (this.state.screen !== "questionAsked")
                return;
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.isReady = true;
                this.state.currentQuestion.addAnswer(client, answer);
            }
            // if all players submitted answers
            if (this.areAllPlayersReady()) {
                this.beginDuels();
            }
        });
        this.onMessage("submitDuelChoice", async (client, answer) => {
            if (this.state.screen !== "duel" || this.state.currentDuel.revealVotes)
                return;
            const player = this.state.players.get(client.sessionId);
            if (player && !this.state.currentDuel.votes.has(client.sessionId)) {
                player.isReady = true;
                this.state.currentDuel.votes.set(client.sessionId, answer);
            }
            if (this.areAllPlayersReady()) {
                this.updateScores();
                this.unreadyPlayers();
                this.state.currentDuel.reveal();
            }
        });
        this.onMessage('requestNextScreen', (client) => {
            if (client.sessionId !== this.state.host)
                return;
            if (this.state.screen === 'whoSaidWhat') {
                this.beginNewRound();
            }
            if (this.state.screen === 'duel' && this.state.currentDuel?.revealVotes) {
                this.beginNextDuel();
            }
        });
        this.onMessage('restartGame', (client, message) => {
            if (client.sessionId !== this.state.host)
                return;
            const newState = new RoomState_1.RoomState();
            newState.host = this.state.host;
            newState.randomQuestionQueue = this.getRandomQuestionQueue();
            this.state.players.forEach((v, k) => {
                const newPlayer = new RoomState_1.Player();
                newPlayer.id = k;
                newPlayer.score = 0;
                newPlayer.emoji = v.emoji;
                newPlayer.nickname = v.nickname;
                newState.players.set(k, newPlayer);
            });
            this.setState(newState);
            this.unlock();
        });
    }
    updateScores() {
        this.state.currentDuel.votes.forEach((answer, clientId) => {
            const player = this.state.players.get(clientId);
            const isCorrect = answer === this.state.currentDuel.internalCorrectPlayerId;
            if (player) {
                // do sumtn fun here....
                player.score += isCorrect ? 1 : 0;
            }
        });
    }
    startGame() {
        console.log(`Starting game in room ${this.roomId}`);
        this.lock();
        this.beginNewRound();
    }
    beginNewRound() {
        this.unreadyPlayers();
        if (this.state.randomQuestionQueue.length === 0) {
            this.showScoresAndEndGame();
            return;
        }
        this.state.currentDuel = undefined;
        this.state.roundCount += 1;
        this.state.screen = "questionAsked";
        this.state.currentQuestion = new RoomState_1.Question(this.state.randomQuestionQueue.shift());
    }
    beginDuels() {
        this.unreadyPlayers();
        this.state.generateDuelQueue();
        this.beginNextDuel();
    }
    showScoresAndEndGame() {
        this.unreadyPlayers();
        this.state.finalScores.push(...this.state.players.values());
        this.state.screen = "scores";
        this.broadcast('showScores');
    }
    beginNextDuel() {
        // if there are no more duels, end the round
        this.unreadyPlayers();
        if (this.state.internalDuels.length === 0) {
            this.state.currentQuestion.revealAnswers();
            this.state.screen = 'whoSaidWhat';
            return;
        }
        this.state.currentDuel = this.state.internalDuels.shift();
        this.state.screen = 'duel';
        this.broadcast('beginNewDuel');
    }
    areAllPlayersReady() {
        let allReady = true;
        this.state.players.forEach(player => {
            if (!player.isReady) {
                allReady = false;
            }
        });
        return allReady;
    }
    unreadyPlayers() {
        this.state.players.forEach(player => {
            player.isReady = false;
        });
        this.broadcastPatch();
    }
    onJoin(client, options) {
        console.log(`${client.sessionId}, ${options.nickname} joined!`);
        // the first player to join is the host
        if (!this.state.host) {
            this.state.host = client.sessionId;
        }
        const name = options.nickname.substring(0, 15);
        const player = new RoomState_1.Player();
        player.id = client.sessionId;
        player.nickname = name;
        player.emoji = emojis_1.getRandomEmoji();
        this.state.players.set(client.sessionId, player);
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
        // if it were the host, pick a new host
        if (client.sessionId === this.state.host) {
            this.state.host = this.state.players.keys().next().value;
        }
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
        this.presence.srem(this.LOBBY_CHANNEL, this.roomId);
    }
    async generateRoomId() {
        const currentIds = await this.presence.smembers(this.LOBBY_CHANNEL);
        let id;
        do {
            id = nanoid();
        } while (currentIds.includes(id));
        await this.presence.sadd(this.LOBBY_CHANNEL, id);
        return id;
    }
    getRandomQuestionQueue(amount = this.QUESTION_AMOUNT) {
        if (this.allQuestions.length < amount) {
            console.warn("Not enough questions to generate a random queue, reloading all questions...");
            this.allQuestions = questions_1.getAllQuestions();
        }
        const q = this.allQuestions.slice(0, amount);
        this.allQuestions = this.allQuestions.slice(amount);
        return q;
    }
}
exports.GameRoom = GameRoom;
