import { Schema, MapSchema, type } from "@colyseus/schema";
import { getRandomQueue } from "../../utils/questions";

export class Player extends Schema {
  @type('string')
  nickname = '';

  @type('string')
  emoji = '🙈';

  @type('boolean')
  isReady = false;

  @type('number')
  score = 0;

  @type('boolean')
  answeredCurrentQuestion = false;
}

export class RoomState extends Schema {
  @type('string')
  host: string;

  @type('number')
  roundCount = 0;

  @type({map: Player})
  players = new MapSchema<Player>();

  @type('string')
  screen: ('lobby' | 'duel' | 'questionAsked') = 'lobby';

  @type('string')
  currentQuestion: string;

  @type({array: 'string'})
  submittedAnswers: string[] = [];

  internalAnswers: Map<string, string> = new Map();

  randomQuestionQueue = getRandomQueue();

  constructor() {
    super();
    this.currentQuestion = this.randomQuestionQueue.shift();
  }

  clearAnswers() {
    this.internalAnswers.clear();
    this.submittedAnswers = [];
    this.players.forEach(player => {
      player.answeredCurrentQuestion = false;
    });
  }
}
