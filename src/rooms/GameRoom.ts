import { Room, Client } from "colyseus";
import { customAlphabet } from 'nanoid'
import { Player, RoomState } from "./schema/RoomState";
import { getRandomEmoji } from "./utils/emojis";

const nanoid = customAlphabet('1234567890abcdefghijklmnoprstuwxyz', 6)

export class GameRoom extends Room<RoomState> {
  LOBBY_CHANNEL = "$epiclobby"

  async onCreate (options: any) {
    this.roomId = await this.generateRoomId();
    this.setPrivate(true);
    this.maxClients = 9;
    this.setState(new RoomState());
    console.log(`Game room ${this.roomId} created!`);

    this.onMessage("toggleReady", (client, ready) => {
      if (this.state.screen !== "lobby") return;
      
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = ready;
      }

      // check if all players are ready and start game
      if (this.state.players.size > 1) {
        let allReady = true;
        this.state.players.forEach(player => {
          if (!player.isReady) {
            allReady = false;
          }
        })
        if (allReady) {
          this.startGame();
        }
      }
    });

    this.onMessage("submitAnswer", (client, answer) => {
      if (this.state.screen !== "questionAsked") return;
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.answeredCurrentQuestion = true;
        this.state.internalAnswers.set(client.sessionId, answer);
      }
      // if all players submitted answers
      if (this.state.internalAnswers.size === this.state.players.size) {
        this.beginDuels();
      }
    })
  }

  startGame() {
    console.log(`Starting game in room ${this.roomId}`);
    this.lock();
    this.beginNewRound();
  }

  beginNewRound() {
    this.state.roundCount += 1;
    this.state.clearAnswers();
    this.state.screen = "questionAsked";
    this.state.currentQuestion = this.state.randomQuestionQueue.shift();
  }

  beginDuels() {
    this.state.clearAnswers();
    this.state.screen = "duel";
  }

  onJoin (client: Client, options: any) {
    console.log(`${client.sessionId}, ${options.nickname} joined!`);

    // the first player to join is the host
    if (!this.state.host) {
      this.state.host = client.sessionId;
    }

    const player = new Player();
    player.nickname = options.nickname;
    player.emoji = getRandomEmoji();
    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
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

  async generateRoomId(): Promise<string> {
    const currentIds = await this.presence.smembers(this.LOBBY_CHANNEL);
    let id;
    do {
        id = nanoid();
    } while (currentIds.includes(id));

    await this.presence.sadd(this.LOBBY_CHANNEL, id);
    return id;
}
}
