import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  Message,
  StringSelectMenuBuilder,
  TextInputStyle,
  resolveColor,
  type APIEmbed,
  type BaseMessageOptions,
  type HexColorString,
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

  public getBaseEmbed(): APIEmbed {
    return {
      title: this.name,
      color: resolveColor(<HexColorString>this.embedColor ?? <HexColorString>CommonService.getRandomColor()),
      footer: {
        text: `⬆️ Level ${this.level} | 💡 ${this.exp} XP`,
      },
      thumbnail: { url: this.imageUrl },
    };
  }
  public getLevelingDetails() {
    const expRequiredForNextLevel = Math.floor(Math.pow(this.level, LEVELING_QUOTIENT));
    const percentage = Math.floor((this.exp / expRequiredForNextLevel) * 100);

    const filledBar = "🟩";
    const emptyBar = "⬛";
    const barLength = 10;
    const barFill = Math.floor((percentage / 100) * barLength);
    const barEmpty = barLength - barFill;
    return {
      progressBar: `${filledBar.repeat(barFill)}${emptyBar.repeat(barEmpty)} ${percentage}%`,
      expRequiredForNextLevel,
      isLevelUp: (xp: number) => xp >= expRequiredForNextLevel && this.level < MAX_CHARACTER_LEVEL,
    };
  }
  public getFullCharacterProfile({
    language = "en-US",
    isEditing = true,
    isCharOwner = false,
  }: {
    language: "en-US" | "pt-BR";
    isEditing: boolean;
    isCharOwner: boolean;
  }) {
    type CharacterProfileMessageOptions = BaseMessageOptions & {
      components?: Array<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>>;
      buttons?: Button[];
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
    embed.fields = fields;
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
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([selectEditMenu.getAPIComponent()])
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
    embed.author = {
      name: this.title ?? message.author.username,
      icon_url: this.title ? undefined : message.author.displayAvatarURL(),
    };
    embed.description = message.content;
    if (message.attachments.size) {
      const url = message.attachments.first()!.url;
      if (CommonService.isAbsoluteImageUrl(url)) {
        const imageUrl = await CommonService.uploadToImgur(url);
        embed.image = { url: imageUrl };
      }
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
    language: "en-US" | "pt-BR";
    isCharOwner: boolean;
    isEditing: boolean;
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
        const editPopup = new Modal<Record<(typeof EDITABLE_PROFILE_FIELDS)[number], string>>().addTextInput({
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
          })
          .catch(() => {
            console.error("User took too long to submit the modal.");
            return null;
          });
        if (modalSubmitInteraction) {
          await modalSubmitInteraction.deferReply();
          const data = editPopup.getUserResponse(modalSubmitInteraction);
          const updateCharacter = await CharacterService.updateCharacter({
            ...this,
            [selectedField]: data[selectedField],
          });

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
