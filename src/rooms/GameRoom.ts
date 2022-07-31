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
    this.setState(new RoomState());

    this.onMessage("toggleReady", (client, ready) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = ready;
      }
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.nickname = options.nickname;
    player.emoji = getRandomEmoji();
    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
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
