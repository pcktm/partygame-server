"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomState = exports.Duel = exports.Question = exports.Player = void 0;
const schema_1 = require("@colyseus/schema");
const lodash_1 = __importDefault(require("lodash"));
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.nickname = '';
        this.emoji = '🙈';
        this.isReady = false;
        this.score = 0;
    }
}
__decorate([
    schema_1.type('string')
], Player.prototype, "id", void 0);
__decorate([
    schema_1.type('string')
], Player.prototype, "nickname", void 0);
__decorate([
    schema_1.type('string')
], Player.prototype, "emoji", void 0);
__decorate([
    schema_1.type('boolean')
], Player.prototype, "isReady", void 0);
__decorate([
    schema_1.type('number')
], Player.prototype, "score", void 0);
exports.Player = Player;
class Question extends schema_1.Schema {
    constructor(question = '') {
        super();
        this.text = '';
        this.answers = new schema_1.MapSchema();
        this.internalAnswers = new Map();
        this.text = question;
    }
    addAnswer(client, answer) {
        this.internalAnswers.set(client.sessionId, answer);
    }
    revealAnswers() {
        this.internalAnswers.forEach((v, k) => {
            this.answers.set(k, v);
        });
    }
}
__decorate([
    schema_1.type('string')
], Question.prototype, "text", void 0);
__decorate([
    schema_1.type({ map: 'string' })
], Question.prototype, "answers", void 0);
exports.Question = Question;
class Duel extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.revealVotes = false;
        this.votes = new schema_1.MapSchema();
    }
    reveal() {
        this.revealVotes = true;
    }
}
__decorate([
    schema_1.type('string')
], Duel.prototype, "answer", void 0);
__decorate([
    schema_1.type(Player)
], Duel.prototype, "left", void 0);
__decorate([
    schema_1.type(Player)
], Duel.prototype, "right", void 0);
__decorate([
    schema_1.type('boolean')
], Duel.prototype, "revealVotes", void 0);
__decorate([
    schema_1.type({ map: 'string' })
], Duel.prototype, "votes", void 0);
exports.Duel = Duel;
class RoomState extends schema_1.Schema {
    constructor() {
        super();
        this.roundCount = 0;
        this.players = new schema_1.MapSchema();
        this.finalScores = new schema_1.ArraySchema();
        this.screen = 'lobby';
        this.internalDuels = [];
        this.randomQuestionQueue = [];
        this.currentQuestion = new Question(this.randomQuestionQueue.shift());
    }
    generateDuelQueue() {
        this.internalDuels = [];
        const availablePlayers = lodash_1.default.shuffle(Array.from(this.currentQuestion.internalAnswers.keys()));
        const duels = [];
        for (let i = 0; i < availablePlayers.length - 1; i += 1) {
            const first = availablePlayers[i];
            const second = availablePlayers[i + 1];
            const duel = new Duel();
            duel.internalCorrectPlayerId = first;
            duel.answer = this.currentQuestion.internalAnswers.get(first);
            // pokazywać prawdziwe odpowiedzi dopiero pod koniec rundy
            if (Math.random() > 0.5) {
                duel.left = this.players.get(first);
                duel.right = this.players.get(second);
            }
            else {
                duel.left = this.players.get(second);
                duel.right = this.players.get(first);
            }
            duels.push(duel);
        }
        this.internalDuels = lodash_1.default.shuffle(duels);
    }
}
__decorate([
    schema_1.type('string')
], RoomState.prototype, "host", void 0);
__decorate([
    schema_1.type('number')
], RoomState.prototype, "roundCount", void 0);
__decorate([
    schema_1.type({ map: Player })
], RoomState.prototype, "players", void 0);
__decorate([
    schema_1.type({ array: Player })
], RoomState.prototype, "finalScores", void 0);
__decorate([
    schema_1.type('string')
], RoomState.prototype, "screen", void 0);
__decorate([
    schema_1.type(Question)
], RoomState.prototype, "currentQuestion", void 0);
__decorate([
    schema_1.type(Duel)
], RoomState.prototype, "currentDuel", void 0);
exports.RoomState = RoomState;
