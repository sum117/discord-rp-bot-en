import type { posts } from "../schema";
import type { Character } from "./Character";

export type PostType = typeof posts.$inferSelect & {
  characters: Array<Character>;
};

export class Post implements PostType {
  public messageId: string;
  public channelId: string;
  public guildId: string;
  public content: string;
  public authorId: string;
  public characters: Array<Character>;

  public constructor(data: PostType) {
    this.messageId = data.messageId;
    this.channelId = data.channelId;
    this.guildId = data.guildId;
    this.content = data.content;
    this.authorId = data.authorId;
    this.characters = data.characters;
  }

  public toJson<T extends boolean>(
    withCharacters: T
  ): T extends true ? PostType : Omit<PostType, "characters">;
  public toJson(withCharacters = false) {
    const data = {
      messageId: this.messageId,
      channelId: this.channelId,
      guildId: this.guildId,
      content: this.content,
      authorId: this.authorId,
    };
    if (withCharacters) {
      return {
        ...data,
        characters: this.characters.map((character) => character.toJson()),
      };
    }
    return data;
  }
}
