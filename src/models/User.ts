import { translateFactory } from "../i18n";
import { users } from "../schema";

export type UserType = typeof users.$inferSelect;
export class User implements UserType {
  public id: string;
  public joinedBotAt: Date | null;
  public level: number;
  public preferredLanguage: "en-US" | "pt-BR";
  public exp: number;

  public constructor(data: UserType) {
    this.id = data.id;
    this.joinedBotAt = data.joinedBotAt;
    this.level = data.level;
    this.preferredLanguage = data.preferredLanguage;
    this.exp = data.exp;
  }

  public getTranslateFunction() {
    return translateFactory(this.preferredLanguage);
  }

  public setPreferredLanguage(language: "en-US" | "pt-BR") {
    this.preferredLanguage = language;
    return this;
  }
}
