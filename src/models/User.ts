import { translateFactory } from "../i18n";
import type { users } from "../schema";
import type { Character } from "./Character";

export type UserType = typeof users.$inferSelect;
export class User implements UserType {
  public id: string;
  public joinedBotAt: Date | null;
  public level: number;
  public preferredLanguage: "en-US" | "pt-BR";
  public exp: number;
  public currentCharacterId: number | null;
  public characters?: Character[];

  public constructor(data: UserType & { characters?: Character[] }) {
    this.id = data.id;
    this.joinedBotAt = data.joinedBotAt;
    this.level = data.level;
    this.preferredLanguage = data.preferredLanguage;
    this.exp = data.exp;
    this.currentCharacterId = data.currentCharacterId;
    this.characters = data.characters;
  }

  public getTranslateFunction() {
    return translateFactory(this.preferredLanguage);
  }

  public setPreferredLanguage(language: "en-US" | "pt-BR") {
    this.preferredLanguage = language;
    return this;
  }

  public ownsCharacter(characterId: number) {
    return this.characters?.some((character) => character.id === characterId);
  }

  public toJson(): UserType {
    return {
      id: this.id,
      joinedBotAt: this.joinedBotAt,
      level: this.level,
      preferredLanguage: this.preferredLanguage,
      exp: this.exp,
      currentCharacterId: this.currentCharacterId,
    };
  }
}
