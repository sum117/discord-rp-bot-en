import {
  Message,
  resolveColor,
  type APIEmbed,
  type BaseMessageOptions,
  type HexColorString,
} from "discord.js";
import { LEVELING_QUOTIENT, MAX_CHARACTER_LEVEL } from "../data/constants";
import { characters } from "../schema";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";

export type CharacterType = typeof characters.$inferSelect;

export class Character implements CharacterType {
  public id: number;
  public authorId: string;
  public name: string;
  public level: number;
  public exp: number;
  public age: number;
  public imageUrl: string;
  public birthday: Date | null;
  public backstory: string | null;
  public personality: string | null;
  public appearance: string | null;
  public race: string | null;
  public gender: string | null;
  public pronouns: string | null;
  public title: string | null;
  public embedColor: string | null;

  public constructor(data: CharacterType) {
    this.id = data.id;
    this.authorId = data.authorId;
    this.name = data.name;
    this.level = data.level;
    this.exp = data.exp;
    this.age = data.age;
    this.imageUrl = data.imageUrl;
    this.birthday = data.birthday;
    this.backstory = data.backstory;
    this.personality = data.personality;
    this.appearance = data.appearance;
    this.race = data.race;
    this.gender = data.gender;
    this.pronouns = data.pronouns;
    this.title = data.title;
    this.embedColor = data.embedColor;
  }

  public getLevelingDetails() {
    const expRequiredForNextLevel = Math.floor(
      Math.pow(this.level, LEVELING_QUOTIENT)
    );
    const percentage = Math.floor((this.exp / expRequiredForNextLevel) * 100);

    const filledBar = "🟩";
    const emptyBar = "⬛";
    const barLength = 10;
    const barFill = Math.floor((percentage / 100) * barLength);
    const barEmpty = barLength - barFill;
    return {
      progressBar: `${filledBar.repeat(barFill)}${emptyBar.repeat(
        barEmpty
      )} ${percentage}%`,
      expRequiredForNextLevel,
      isLevelUp: (xp: number) =>
        xp >= expRequiredForNextLevel && this.level < MAX_CHARACTER_LEVEL,
    };
  }

  public getCharacterPostFromMessage(
    message: Message
  ): BaseMessageOptions | null {
    const embed: APIEmbed = {
      title: this.name,
      color: resolveColor(
        <HexColorString>this.embedColor ??
          <HexColorString>CommonService.getRandomColor()
      ),
      footer: {
        text: `⬆️ Level ${this.level} | 💡 ${this.exp} XP`,
      },
      thumbnail: { url: this.imageUrl },
      author: {
        name: this.title ?? message.author.username,
        icon_url: this.title ? undefined : message.author.displayAvatarURL(),
      },
      description: message.content,
    };

    return { embeds: [embed] };
  }

  public async levelUp() {
    this.level += 1;
    this.exp = 0;
    const updatedCharacter = await CharacterService.updateCharacter(this);
    return updatedCharacter;
  }

  public toJson(): CharacterType {
    return {
      id: this.id,
      authorId: this.authorId,
      name: this.name,
      level: this.level,
      exp: this.exp,
      age: this.age,
      imageUrl: this.imageUrl,
      birthday: this.birthday,
      backstory: this.backstory,
      personality: this.personality,
      appearance: this.appearance,
      race: this.race,
      gender: this.gender,
      pronouns: this.pronouns,
      title: this.title,
      embedColor: this.embedColor,
    };
  }
}
