import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  Message,
  resolveColor,
  type APIEmbed,
  type BaseMessageOptions,
  type HexColorString,
} from "discord.js";
import { Button } from "../components/Button";
import {
  ALL_PROFILE_FIELDS,
  BUTTON_CUSTOM_IDS,
  DATE_PROFILE_FIELDS,
  LEVELING_QUOTIENT,
  LONG_PROFILE_FIELDS,
  MAX_CHARACTER_LEVEL,
} from "../data/constants";
import translate from "../i18n";
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
  public lastPostAt: Date | null;
  public createdAt: Date | null;

  public constructor(data: CharacterType) {
    this.id = data.id;
    this.authorId = data.authorId;
    this.name = data.name;
    this.level = data.level;
    this.exp = data.exp;
    this.age = data.age;
    this.imageUrl = data.imageUrl;
    this.birthday = data.birthday;
    this.lastPostAt = data.lastPostAt;
    this.backstory = data.backstory;
    this.personality = data.personality;
    this.appearance = data.appearance;
    this.race = data.race;
    this.gender = data.gender;
    this.pronouns = data.pronouns;
    this.title = data.title;
    this.createdAt = data.createdAt;
    this.embedColor = data.embedColor;
  }

  public getBaseEmbed(): APIEmbed {
    return {
      title: this.name,
      color: resolveColor(
        <HexColorString>this.embedColor ??
          <HexColorString>CommonService.getRandomColor()
      ),
      footer: {
        text: `⬆️ Level ${this.level} | 💡 ${this.exp} XP`,
      },
      thumbnail: { url: this.imageUrl },
    };
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
  public getFullCharacterProfile(
    language: "en-US" | "pt-BR" = "en-US",
    isEditing = false
  ) {
    const levelingDetails = this.getLevelingDetails();
    const embed = this.getBaseEmbed();
    const fields = ALL_PROFILE_FIELDS.filter(
      (key) => !LONG_PROFILE_FIELDS.includes(key)
    ).map((key) => {
      return {
        name: translate(key, { lng: language }),
        value: this.isDateField(key)
          ? Intl.DateTimeFormat(language).format(this[key]!)
          : this[key]?.toString() ?? translate("notDefined", { lng: language }),
        inline: true,
      };
    });
    fields.push({
      name: translate("leveling", { lng: language }),
      value: `${levelingDetails.progressBar} ${this.level}/${MAX_CHARACTER_LEVEL}`,
      inline: true,
    });
    embed.fields = fields;

    if (!isEditing) {
      const { buttons, actionRow } = this.getFullProfileButtons(language);
      return { embeds: [embed], components: [actionRow], buttons };
    }

    return { embeds: [embed] };
  }

  public getCharacterPostFromMessage(
    message: Message
  ): BaseMessageOptions | null {
    const data: BaseMessageOptions = {};
    const embed = this.getBaseEmbed();
    embed.author = {
      name: this.title ?? message.author.username,
      icon_url: this.title ? undefined : message.author.displayAvatarURL(),
    };
    embed.description = message.content;
    if (message.attachments.size) {
      const parsedUrl = new URL(message.attachments.first()!.url);
      parsedUrl.search = "";

      const fileName = parsedUrl.pathname.split("/").pop();
      if (fileName && CommonService.isAbsoluteImageUrl(parsedUrl.toString())) {
        const attachment = new AttachmentBuilder(parsedUrl.toString()).setName(
          fileName
        );
        data.files = [attachment];
        embed.image = { url: "attachment://" + fileName };
      }
    }

    return { embeds: [embed], ...data };
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
      createdAt: this.createdAt,
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
      lastPostAt: this.lastPostAt,
    };
  }

  private isDateField(
    key: string
  ): key is (typeof DATE_PROFILE_FIELDS)[number] {
    return (
      typeof key === "string" &&
      DATE_PROFILE_FIELDS.includes(key) &&
      key in this &&
      !!this[key as keyof CharacterType]
    );
  }

  public getFullProfileButtons(language: "en-US" | "pt-BR" = "en-US") {
    const buttons = LONG_PROFILE_FIELDS.map((key) => {
      return new Button({
        customId: BUTTON_CUSTOM_IDS[key],
        label: translate(key, { lng: language }),
        onClick: async (interaction: ButtonInteraction) => {
          await interaction.reply(this.showLongFieldEmbed(key));
        },
      });
    });

    return {
      actionRow: new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.map((button) => button.getAPIComponent())
      ),
      buttons,
    };
  }

  private showLongFieldEmbed(
    fieldKey: (typeof LONG_PROFILE_FIELDS)[number],
    language: "en-US" | "pt-BR" = "en-US"
  ): BaseMessageOptions {
    const embed = this.getBaseEmbed();
    delete embed.image;
    delete embed.thumbnail;
    delete embed.footer;
    embed.title = translate(`${fieldKey}Suffix`, {
      lng: language,
      characterName: this.name,
    });
    const fieldToDisplay = this[fieldKey];
    if (!fieldToDisplay || fieldToDisplay.trim() === "") {
      embed.description = translate("notDefined", { lng: language });
    } else {
      embed.description = fieldToDisplay;
    }
    return { embeds: [embed] };
  }
}
