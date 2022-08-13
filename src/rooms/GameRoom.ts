import {Room, Client} from 'colyseus';
import {customAlphabet} from 'nanoid';
import lodash from 'lodash';
import {IncomingMessage} from 'http';
import UAParser from 'ua-parser-js';
import {logger} from '../utils/loggers';
import {
  Duel, Player, Question, RoomState,
} from './schema/RoomState';
import {getRandomEmoji} from '../utils/emojis';
import {getAllQuestions} from '../utils/questions';

const nanoid = customAlphabet('abcdefghijklmnoprstuwxyz', 6);

export class GameRoom extends Room<RoomState> {
  LOBBY_CHANNEL = '$epiclobby';

  REGULAR_WAIT_TIME = 8 * 1000;

  QUESTION_AMOUNT = 8;

  MAX_CLIENTS = 12;

  allQuestions = getAllQuestions();

  async onCreate(options: never) {
    this.roomId = await this.generateRoomId();
    this.setPrivate(true);
    this.maxClients = this.MAX_CLIENTS;

    const state = new RoomState();
    state.randomQuestionQueue = this.getRandomQuestionQueue();
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
      }
    });

    this.onMessage('submitAnswer', (client, answer) => {
      if (this.state.screen !== 'questionAsked') return;
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

    this.onMessage('submitDuelChoice', async (client, answer) => {
      if (this.state.screen !== 'duel' || this.state.currentDuel.revealVotes) return;
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
      const newState = new RoomState();
      newState.host = this.state.host;
      newState.randomQuestionQueue = this.getRandomQuestionQueue();
      this.state.players.forEach((v, k) => {
        const newPlayer = new Player();
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
    logger.info({roomId: this.roomId}, 'starting game');
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
    this.state.screen = 'questionAsked';
    this.state.currentQuestion = new Question(this.state.randomQuestionQueue.shift());
  }

  beginDuels() {
    this.unreadyPlayers();
    this.state.generateDuelQueue();
    this.beginNextDuel();
  }

  showScoresAndEndGame() {
    this.unreadyPlayers();
    this.state.finalScores.push(...this.state.players.values());
    this.state.screen = 'scores';
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
    this.state.players.forEach((player) => {
      if (!player.isReady) {
        allReady = false;
      }
    });
    return allReady;
  }

  unreadyPlayers() {
    for (const playerId of this.state.players.keys()) {
      const player = this.state.players.get(playerId);
      if (player) {
        player.isReady = false;
      }
    }
    this.broadcastPatch();
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
      remoteAddress: request.socket.remoteAddress,
      browser: `${browser.browser.name} ${browser.browser.version}`,
      os: `${browser.os.name} ${browser.os.version}`,
    }, 'client authenticated');
    return true;
  }

  onLeave(client: Client, consented: boolean) {
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

  getRandomQuestionQueue(amount = this.QUESTION_AMOUNT) {
    if (this.allQuestions.length < amount) {
      logger.warn({roomId: this.roomId}, 'Not enough questions to generate a random queue, reloading all questions...');
      this.allQuestions = getAllQuestions();
    }
    const q = this.allQuestions.slice(0, amount);
    this.allQuestions = this.allQuestions.slice(amount);
    return q;
  }
}
