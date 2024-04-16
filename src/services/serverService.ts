import { eq } from "drizzle-orm";
import db from "../database";
import Server from "../models/Server";
import { characterServerData, servers } from "../schema";

export type ServerType = typeof servers.$inferSelect;
export class ServerService {
  public static async getOrCreateServer(serverId: string) {
    const foundServer = await db.query.servers.findFirst({
      where: (servers, { eq }) => eq(servers.id, serverId),
    });

    if (!foundServer) {
      const [createdServer] = await db.insert(servers).values({ id: serverId }).returning();
      if (!createdServer) {
        throw new Error("Failed to create server");
      }
      return new Server(createdServer);
    }
    return new Server(foundServer);
  }
  public static async getOrCreateCharacterServerData(characterId: number, serverId: string) {
    const serverData = await db.query.characterServerData.findFirst({
      where: (data, { and }) => and(eq(data.characterId, characterId), eq(data.serverId, serverId)),
    });
    if (!serverData) {
      const [createdServerData] = await db
        .insert(characterServerData)
        .values({ characterId, serverId, money: 0 })
        .returning();
      if (!createdServerData) {
        throw new Error(`Failed to create characterServerData for character ${characterId} and server ${serverId}`);
      }
      return createdServerData;
    }
    return serverData;
  }

  public static async updateServer(server: Server) {
    return await db.update(servers).set(server).where(eq(servers.id, server.id)).returning();
  }
}
