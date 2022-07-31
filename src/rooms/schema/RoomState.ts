import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type('string')
  nickname = '';

  @type('string')
  emoji = '🙈';

  @type('boolean')
  isReady = false;

  @type('number')
  score = 0;
}

export class RoomState extends Schema {
  @type({map: Player})
  players = new MapSchema<Player>();

  @type('string')
  screen: ('lobby' | 'questionScores' | 'questionAsked') = 'lobby';
}
