import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Room, Client } from "colyseus";
import { getRandomQueue } from "../../utils/questions";
import lodash from 'lodash';

export class Player extends Schema {
  @type('string')
  id: string;

  @type('string')
  nickname = '';

  @type('string')
  emoji = '🙈';

  @type('boolean')
  isReady = false;

  @type('number')
  score = 0;
}

export class Question extends Schema {
  @type('string')
  text = '';

  answers: Map<string, string> = new Map();

  addAnswer(client: Client, answer: string) {
    this.answers.set(client.sessionId, answer);
  }

  constructor(question: string = '') {
    super();
    this.text = question;
  }
}

export class Duel extends Schema {
  @type('string')
  answer: string;

  @type(Player)
  left?: Player;

  @type(Player)
  right?: Player;

  @type('boolean')
  revealVotes = false;

  internalCorrectPlayerId: string;

  @type('string')
  correctPlayerId: string;

  @type({map: 'string'})
  votes = new MapSchema<string>();

  reveal() {
    this.correctPlayerId = this.internalCorrectPlayerId;
    this.revealVotes = true;
  }
}

export class RoomState extends Schema {
  @type('string')
  host: string;

  @type('number')
  roundCount = 0;

  @type({map: Player})
  players = new MapSchema<Player>();

  @type({array: Player})
  finalScores = new ArraySchema<Player>();

  @type('string')
  screen: ('lobby' | 'duel' | 'questionAsked' | 'scores') = 'lobby';

  @type(Question)
  currentQuestion: Question;

  @type(Duel)
  currentDuel: Duel;

  internalDuels: Duel[] = [];
  randomQuestionQueue: string[] = [];

  constructor() {
    super();
    this.currentQuestion = new Question(this.randomQuestionQueue.shift());
  }

  generateDuelQueue() {
    this.internalDuels = [];
    const availablePlayers = lodash.shuffle(Array.from(this.currentQuestion.answers.keys()));
    const duels: Duel[] = [];

    for (let i = 0; i < availablePlayers.length - 1; i += 1) {
      const first = availablePlayers[i];
      const second = availablePlayers[i + 1];

      const duel = new Duel();
      duel.internalCorrectPlayerId = first;
      duel.answer = this.currentQuestion.answers.get(first);
      // pokazywać prawdziwe odpowiedzi dopiero pod koniec rundy

      if (Math.random() > 0.5) {
        duel.left = this.players.get(first);
        duel.right = this.players.get(second);
      } else {
        duel.left = this.players.get(second);
        duel.right = this.players.get(first);
      }

      duels.push(duel);
    }
    this.internalDuels = lodash.shuffle(duels);
  }

}
