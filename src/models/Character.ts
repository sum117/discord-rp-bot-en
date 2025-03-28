import {
  ActionRowBuilder,
  type BaseMessageOptions,
  type ButtonBuilder,
  type ButtonInteraction,
  EmbedBuilder,
  type HexColorString,
  type Message,
  type StringSelectMenuBuilder,
  TextInputStyle,
} from "discord.js";
import { Duration } from "luxon";

import { Button } from "../components/Button";
import Modal, { TextInputLength } from "../components/Modal";
import { Select } from "../components/Select";
import {
  ALL_PROFILE_FIELDS,
  BUTTON_CUSTOM_IDS,
  DATE_PROFILE_FIELDS,
  EDITABLE_PROFILE_FIELDS,
  LEVELING_QUOTIENT,
  LONG_PROFILE_FIELDS,
  MAX_CHARACTER_LEVEL,
  SELECT_CUSTOM_IDS,
} from "../data/constants";
import translate from "../i18n";
import type { characters } from "../schema";
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
  public birthday: string | null;
  public backstory: string | null;
  public personality: string | null;
  public appearance: string | null;
  public race: string | null;
  public gender: string | null;
  public pronouns: string | null;
  public title: string | null;
  public embedColor: string | null;
  public lastPostAt: Date | null;
  public lastExpGainAt: Date | null;
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
    this.lastExpGainAt = data.lastExpGainAt;
  }
  public setField(field: keyof CharacterType, value: string) {
    switch (field) {
      case "name":
        this.name = value;
        break;
      case "age":
        this.age = parseInt(value);
        break;
      case "imageUrl":
        this.imageUrl = value;
        break;
      case "birthday":
        this.birthday = value;
        break;
      case "backstory":
        this.backstory = value;
        break;
      case "personality":
        this.personality = value;
        break;
      case "appearance":
        this.appearance = value;
        break;
      case "race":
        this.race = value;
        break;
      case "gender":
        this.gender = value;
        break;
      case "pronouns":
        this.pronouns = value;
        break;
      case "title":
        this.title = value;
        break;
      case "embedColor":
        this.embedColor = value;
        break;
      default:
        break;
    }

    return this;
  }
  public getBaseEmbed(): EmbedBuilder {
    const embedBuilder = new EmbedBuilder()
      .setTitle(this.name)
      .setColor(<HexColorString>this.embedColor ?? <HexColorString>CommonService.getRandomColor())
      .setFooter({
        text: `⬆️ Level ${this.level} | 💡 ${this.exp} XP`,
      })
      .setThumbnail(this.imageUrl);

    return embedBuilder;
  }
  public getLevelingDetails() {
    const expRequiredForNextLevel = Math.floor(Math.pow(this.level, LEVELING_QUOTIENT));
    const percentage = Math.floor((this.exp / expRequiredForNextLevel) * 100);

    const filledBar = "🟩";
    const emptyBar = "⬛";
    const barLength = 10;
    const barFill = Math.min(barLength, Math.floor((percentage / 100) * barLength));
    const barEmpty = barLength - barFill;
    return {
      progressBar: `${filledBar.repeat(barFill)}${emptyBar.repeat(barEmpty)} ${Math.min(percentage, 100)}%`,
      expRequiredForNextLevel,
      isLevelUp: (xp: number) => xp >= expRequiredForNextLevel && this.level < MAX_CHARACTER_LEVEL,
    };
  }
  public getFullCharacterProfile({
    language = "en-US",
    isEditing = true,
    isCharOwner = false,
  }: {
    isCharOwner: boolean;
    isEditing: boolean;
    language: "en-US" | "pt-BR";
  }) {
    type CharacterProfileMessageOptions = BaseMessageOptions & {
      buttons?: Button[];
      components?: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>>;
      selectMenu?: Select;
    };

    const levelingDetails = this.getLevelingDetails();
    const embed = this.getBaseEmbed();
    const fields = ALL_PROFILE_FIELDS.filter((key) => !LONG_PROFILE_FIELDS.includes(key)).map((key) => {
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
    embed.addFields(fields);
    const messageOptions: CharacterProfileMessageOptions = { embeds: [embed] };
    if (isEditing) {
      const { buttons, actionRow } = this.getFullProfileButtons(language);
      const components: Array<ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>> = [actionRow];
      if (isCharOwner) {
        const selectEditMenu = this.getEditSelectMenu({
          language,
          isCharOwner,
          isEditing,
        });
        components.push(
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([selectEditMenu.getAPIComponent()]),
        );
        messageOptions.selectMenu = selectEditMenu;
      }
      messageOptions.components = components;
      messageOptions.buttons = buttons;
    }
    return messageOptions;
  }

  public async getCharacterPostFromMessage(message: Message): Promise<BaseMessageOptions> {
    const data: BaseMessageOptions = {};
    const embed = this.getBaseEmbed();
    embed.setAuthor({
      name: this.title ?? message.author.username,
      iconURL: this.title ? undefined : message.author.displayAvatarURL(),
    });

    if (message.attachments.size) {
      const url = message.attachments.first()!.url;
      if (CommonService.isAbsoluteImageUrl(url)) {
        const embedImageUrl = await CommonService.uploadToWaifuvault(url);
        if (embedImageUrl) {
          embed.setImage(embedImageUrl);
        }
      }
    }
    if (message.content.trim() !== "") {
      embed.setDescription(message.content);
    }
    return { embeds: [embed], ...data };
  }

  public async levelUp() {
    this.level += 1;
    this.lastExpGainAt = new Date();
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
      lastExpGainAt: this.lastExpGainAt,
    };
  }

  private isDateField(key: string): key is (typeof DATE_PROFILE_FIELDS)[number] {
    return (
      typeof key === "string" && DATE_PROFILE_FIELDS.includes(key) && key in this && !!this[key as keyof CharacterType]
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
      actionRow: new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.map((button) => button.getAPIComponent())),
      buttons,
    };
  }
  public getEditSelectMenu({
    language = "en-US",
    isCharOwner = false,
    isEditing = true,
  }: {
    isCharOwner: boolean;
    isEditing: boolean;
    language: "en-US" | "pt-BR";
  }) {
    return new Select({
      customId: SELECT_CUSTOM_IDS.editCharacter,
      placeholder: translate("editCharacter", { lng: language, characterName: this.name }),
      disabled: false,
      options: EDITABLE_PROFILE_FIELDS.map((key) => {
        return {
          label: translate(`${key}Edit`, { lng: language }),
          value: key,
        };
      }),
      onSelection: async (selectMenuInteraction) => {
        const selectedField = selectMenuInteraction.values.at(0) as (typeof EDITABLE_PROFILE_FIELDS)[number];
        const editPopup = new Modal<Record<(typeof EDITABLE_PROFILE_FIELDS)[number], string>>()
          .setCustomId(selectedField)
          .addTextInput({
            customId: selectedField,
            style: LONG_PROFILE_FIELDS.includes(selectedField) ? TextInputStyle.Paragraph : TextInputStyle.Short,
            label: translate(selectedField, { lng: language }),
            placeholder: translate(`${selectedField}InputPlaceholder`, { lng: language }),
            maxLength: LONG_PROFILE_FIELDS.includes(selectedField) ? TextInputLength.Paragraph : TextInputLength.Medium,
            value: this.isDateField(selectedField)
              ? Intl.DateTimeFormat(language).format(this[selectedField]!)
              : this[selectedField]?.toString() ?? "",
          });

        await selectMenuInteraction.showModal(editPopup);
        const modalSubmitInteraction = await selectMenuInteraction
          .awaitModalSubmit({
            time: Duration.fromObject({ minutes: 120 }).as("milliseconds"),
            filter: (interaction) => interaction.customId === selectedField,
          })
          .catch(() => {
            console.error("User took too long to submit the modal.");
            return null;
          });
        if (modalSubmitInteraction) {
          if (!modalSubmitInteraction.deferred || !modalSubmitInteraction.replied) {
            await modalSubmitInteraction.deferReply();
          }
          const data = editPopup.getUserResponse(modalSubmitInteraction);
          const updateCharacter = await CharacterService.updateCharacter(
            this.setField(selectedField, data[selectedField]),
          );

          if (selectedField === "imageUrl") {
            const isImageUrl = CommonService.isAbsoluteImageUrl(updateCharacter.imageUrl);
            if (!isImageUrl) {
              await modalSubmitInteraction.editReply({
                content: translate("invalidImageUrl"),
              });
              return;
            }
          }

          const newProfile = updateCharacter.getFullCharacterProfile({
            isCharOwner,
            isEditing,
            language,
          });

          await modalSubmitInteraction.editReply({
            content: translate(`${selectedField}Set`, {
              lng: language,
              oldCharacterName: this.name,
              characterName: updateCharacter.name,
            }),
          });
          await selectMenuInteraction.message.edit({
            embeds: newProfile.embeds,
          });
        }
      },
    });
  }

  private showLongFieldEmbed(
    fieldKey: (typeof LONG_PROFILE_FIELDS)[number],
    language: "en-US" | "pt-BR" = "en-US",
  ): BaseMessageOptions {
    const embed = this.getBaseEmbed();
    embed.setImage(null);
    embed.setThumbnail(null);
    embed.setFooter(null);
    embed.setTitle(
      translate(`${fieldKey}Suffix`, {
        lng: language,
        characterName: this.name,
      }),
    );
    const fieldToDisplay = this[fieldKey];
    if (!fieldToDisplay || fieldToDisplay.trim() === "") {
      embed.setDescription(translate("notDefined", { lng: language }));
    } else {
      embed.setDescription(fieldToDisplay);
    }
    return { embeds: [embed] };
  }
}
