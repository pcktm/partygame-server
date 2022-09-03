/* eslint-disable no-promise-executor-return */
import {Room, Client} from 'colyseus';
import {customAlphabet} from 'nanoid';
import {IncomingMessage} from 'http';
import lodash from 'lodash';
import UAParser from 'ua-parser-js';
import {Question as DatabaseQuestion} from '@prisma/client';
import {MapSchema} from '@colyseus/schema';
import {logger} from '../utils/loggers';
import {
  Duel, Player, Question as StateQuestion, RoomState,
} from './schema/RoomState';
import {getRandomEmoji} from '../utils/emojis';
import {getShuffledQuestions} from '../utils/questions';
import db from '../utils/database';

const nanoid = customAlphabet('abcdefghijklmnoprstuwxyz', 6);

export class GameRoom extends Room<RoomState> {
  LOBBY_CHANNEL = '$epiclobby';

  QUESTION_AMOUNT = Number(process.env.DEFAULT_QUESTION_AMOUNT) || 8;

  MAX_CLIENTS = Number(process.env.MAX_ALLOWED_CLIENTS) || 12;

  selectedDecks: string[] = [process.env.DEFAULT_DECK_ID ?? ''];

  allQuestions: DatabaseQuestion[] = [];

  async onCreate(options: {decks: string[]}) {
    this.roomId = await this.generateRoomId();
    this.setPrivate(true);
    this.maxClients = this.MAX_CLIENTS;
    this.selectedDecks = options.decks;

    const state = new RoomState();
    this.setState(state);

    logger.info({id: this.roomId}, 'created room');

    this.onMessage('toggleReady', (client, ready) => {
      if (this.state.screen !== 'lobby') return;

      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = ready;
      }

      // check if all players are ready and start game
      if (this.state.players.size > 1 && this.areAllPlayersReady()) {
        this.startGame();
      } else if (this.state.players.size === 1 && player.isReady) {
        client.send('pushToast', {
          type: 'info',
          title: 'toasts.inviteFriends.title',
          description: 'toasts.inviteFriends.description',
        });
      }
    });

    this.onMessage('submitAnswer', (client, answer) => {
      if (this.state.screen !== 'questionAsked') return;
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = true;
        this.state.currentQuestion.addAnswer(client, answer.substring(0, 35));
      }
      // if all players submitted answers
      if (this.areAllPlayersReady()) {
        this.beginDuels();
      }
    });

    this.onMessage('submitDuelChoice', async (client, answer) => {
      if (this.state.screen !== 'duel' || this.state.currentDuel.revealVotes) return;
      const player = this.state.players.get(client.sessionId);
      if (player && !this.state.currentDuel.votes.has(client.sessionId)) {
        player.isReady = true;

        if (!answer) {
          client.send('pushToast', {
            title: 'toasts.invalidChoice.title',
            description: 'toasts.invalidChoice.description',
            type: 'error',
          });
          logger.error({roomId: this.roomId, clientId: client.sessionId, choice: answer}, 'invalid answer');
        }

        this.state.currentDuel.votes.set(client.sessionId, answer ?? this.state.currentDuel.left.id);
      }

      if (this.areAllPlayersReady()) {
        this.updateScores();
        this.state.currentDuel.reveal();
      }
    });

    this.onMessage('requestNextScreen', (client) => {
      if (client.sessionId !== this.state.host) return;
      if (this.state.screen === 'whoSaidWhat') {
        this.beginNewRound();
      }
      if (this.state.screen === 'duel' && this.state.currentDuel?.revealVotes) {
        this.beginNextDuel();
      }
    });

    this.onMessage('restartGame', (client, message) => {
      if (client.sessionId !== this.state.host) return;
      this.restartRoom();
      this.broadcast('pushToast', {
        description: 'toasts.gameRestarted',
        type: 'success',
      });
    });
  }

  restartRoom() {
    const newState = new RoomState();
    newState.host = this.state.host;
    for (const [playerId, player] of this.state.players.entries()) {
      const newPlayer = player.clone();
      newPlayer.score = 0;
      newPlayer.isReady = false;
      newState.players.set(playerId, newPlayer);
    }
    this.setState(newState);
    this.unlock();
  }

  updateScores() {
    let index = 0;
    for (const [clientId, answer] of this.state.currentDuel.votes.entries()) {
      const isCorrect = this.state.currentDuel.internalCorrectPlayerId === answer;
      const player = this.state.players.get(clientId);
      if (isCorrect && player) {
        player.score += isCorrect ? 1 : 0;
        // the first one to guess correctly gets a bonus
        if (index === 0) player.score += 1;
      }
      index += 1;
    }
  }

  async startGame() {
    await db.playedGames.create({
      data: {
        roomId: this.roomId,
        selectedDecks: this.selectedDecks,
        players: Array.from(this.state.players.values()).map((player) => player.nickname),
      },
    });
    logger.info({roomId: this.roomId}, 'starting game');
    this.state.randomQuestionQueue = await this.getRandomQuestionQueue();
    this.lock();
    this.beginNewRound();
  }

  beginNewRound() {
    if (this.state.randomQuestionQueue.length === 0) {
      this.showScoresAndEndGame();
      return;
    }

    this.state.currentDuel = undefined;
    this.state.roundCount += 1;
    this.state.screen = 'questionAsked';
    this.state.currentQuestion = new StateQuestion(this.state.randomQuestionQueue.shift());
    this.unreadyPlayers();
  }

  beginDuels() {
    this.state.generateDuelQueue();
    this.beginNextDuel();
  }

  showScoresAndEndGame() {
    this.state.finalScores.push(...this.state.players.values());
    this.state.screen = 'scores';
    this.broadcast('showScores');
    logger.info({roomId: this.roomId}, 'game ended');
  }

  beginNextDuel() {
    // if there are no more duels, end the round
    if (this.state.internalDuels.length === 0) {
      this.state.currentQuestion.revealAnswers();
      this.state.screen = 'whoSaidWhat';
      return;
    }

    this.unreadyPlayers();
    this.state.currentDuel = this.state.internalDuels.shift();
    this.state.screen = 'duel';
    this.broadcast('beginNewDuel');
  }

  areAllPlayersReady() {
    let allReady = true;
    this.state.players.forEach((player) => {
      if (!player.isReady) {
        allReady = false;
      }
    });
    return allReady;
  }

  unreadyPlayers() {
    const players = new MapSchema<Player>();
    for (const [id, player] of this.state.players.entries()) {
      player.isReady = false;
      players.set(id, player);
    }
    this.state.players = players;
  }

  onJoin(client: Client, options: {nickname: string}) {
    // the first player to join is the host
    if (!this.state.host) {
      this.state.host = client.sessionId;
    }

    const name = options.nickname.substring(0, 15);

    const player = new Player();
    player.id = client.sessionId;
    player.nickname = name;
    player.emoji = getRandomEmoji();
    this.state.players.set(client.sessionId, player);
  }

  onAuth(client: Client, options: {nickname: string}, request?: IncomingMessage) {
    const browser = UAParser(request.headers['user-agent']);
    logger.info({
      roomId: this.roomId,
      clientId: client.sessionId,
      nickname: options.nickname,
      remoteAddress: request.headers['x-forwarded-for'] ?? request.socket.remoteAddress,
      browser: `${browser.browser.name} ${browser.browser.version}`,
      os: `${browser.os.name} ${browser.os.version}`,
    }, 'client authenticated');
    return true;
  }

  async onLeave(client: Client, consented: boolean) {
    logger.info({
      roomId: this.roomId,
      clientId: client.sessionId,
      consented,
    }, 'client left');
    this.state.players.delete(client.sessionId);

    // if it were the host, pick a new host
    if (client.sessionId === this.state.host) {
      this.state.host = this.state.players.keys().next().value;
    }

    // if there are no players left, return to lobby
    if (this.state.players.size < 2 && ['scores', 'lobby'].indexOf(this.state.screen) === -1) {
      await new Promise((res) => setTimeout(res, 500));
      this.restartRoom();
      this.broadcast('pushToast', {
        description: 'toasts.notEnoughPlayers',
        type: 'info',
      });
    }
  }

  onDispose() {
    logger.info({roomId: this.roomId}, 'room disposed');
    this.presence.srem(this.LOBBY_CHANNEL, this.roomId);
  }

  async generateRoomId(): Promise<string> {
    const currentIds = await this.presence.smembers(this.LOBBY_CHANNEL);
    let id;
    do {
      id = nanoid();
    } while (currentIds.includes(id));

    await this.presence.sadd(this.LOBBY_CHANNEL, id);
    return id;
  }

  async getRandomQuestionQueue(amount = this.QUESTION_AMOUNT) {
    if (this.allQuestions.length < amount) {
      logger.warn({roomId: this.roomId}, 'Not enough questions to generate a random queue, reloading all questions...');
      // TODO: this queries the database only once and filters the answers already, while the player count might change between rounds
      this.allQuestions = await getShuffledQuestions({decks: this.selectedDecks, minPlayers: this.state.players.size});
    }
    const q = this.allQuestions.slice(0, amount);
    this.allQuestions = this.allQuestions.slice(amount);

    const mapped = q.map((question) => {
      let temp = question.text;
      if (question.minPlayers > 0) {
        const keys = lodash.sampleSize(Array.from(this.state.players.keys()), question.minPlayers);
        const players = keys.map((k) => this.state.players.get(k));
        for (const player of players) {
          temp = temp.replace('[PLAYER]', `${player.emoji} ${player.nickname}`);
        }
      }
      return temp;
    });

    return mapped;
  }
}
