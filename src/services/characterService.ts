import {
  Message,
  TextInputStyle,
  resolveColor,
  type APIEmbed,
  type BaseMessageOptions,
  type HexColorString,
} from "discord.js";
import Modal, { TextInputLength } from "../components/Modal";
import { TEXT_INPUT_CUSTOM_IDS } from "../data/constants";
import db from "../database";
import { translateFactory } from "../i18n";
import { characters } from "../schema";
import CommonService from "./commonService";
import UserService from "./userService";

export default class CharacterService {
  public static getCreateCharacterModal(
    userOrServerLanguage: "pt-BR" | "en-US" = "pt-BR"
  ) {
    const translate = translateFactory(userOrServerLanguage);
    return new Modal<Record<keyof typeof TEXT_INPUT_CUSTOM_IDS, string>>()
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.name,
        label: translate("modalCharacterNameLabel"),
        placeholder: translate("modalCharacterNamePlaceholder"),
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        required: true,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.imageUrl,
        label: translate("modalCharacterImageUrlLabel"),
        placeholder: translate("modalCharacterImageUrlPlaceholder"),
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        required: true,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.appearance,
        label: translate("modalCharacterAppearanceLabel"),
        placeholder: translate("modalCharacterAppearancePlaceholder"),
        maxLength: TextInputLength.Medium,
        style: TextInputStyle.Paragraph,
        required: false,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.backstory,
        label: translate("modalCharacterBackstoryLabel"),
        placeholder: translate("modalCharacterBackstoryPlaceholder"),
        maxLength: TextInputLength.Paragraph,
        style: TextInputStyle.Paragraph,
        required: false,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.personality,
        label: translate("modalCharacterPersonalityLabel"),
        placeholder: translate("modalCharacterPersonalityPlaceholder"),
        maxLength: TextInputLength.Paragraph,
        style: TextInputStyle.Paragraph,
        required: false,
      });
  }

  public static async getCurrentCharacterByUser(userId: string) {
    const author = await UserService.getOrCreateUser(userId);
    if (!author.currentCharacterId) {
      console.log(`User ${author.id} doesn't have a character selected.`);
      return null;
    }

    const character = await this.getCharacterById(author.currentCharacterId);
    if (!character) {
      console.log(
        `Character with ID ${author.currentCharacterId} not found for ${author.id}.`
      );
      return null;
    }
    return { author, character };
  }

  public static async buildCharacterPostFromMessage(
    message: Message
  ): Promise<BaseMessageOptions | null> {
    const data = await this.getCurrentCharacterByUser(message.author.id);
    if (!data?.character || !data?.author) {
      return null;
    }

    const embed: APIEmbed = {
      title: data.character.name,
      color: resolveColor(
        <HexColorString>data.character.embedColor ??
          <HexColorString>CommonService.getRandomColor()
      ),
      footer: {
        text: `⬆️ Level ${data.character.level} | 💡 ${data.character.exp} XP`,
      },
      thumbnail: { url: data.character.imageUrl },
      author: {
        name: data.character.title ?? message.author.username,
        icon_url: data.character.title
          ? undefined
          : message.author.displayAvatarURL(),
      },
      description: message.content,
    };

    return { embeds: [embed] };
  }

  public static async getCharacterById(
    characterId: number,
    withAuthor = false
  ) {
    return await db.query.characters.findFirst({
      where: (characters, { eq }) => eq(characters.id, characterId),
      with: withAuthor ? { author: true } : {},
    });
  }

  public static async createCharacter(
    characterData: typeof characters.$inferInsert
  ) {
    const createdCharacter = (
      await db.insert(characters).values(characterData).returning()
    ).at(0);
    if (!createdCharacter) {
      throw new Error(
        `Failed to create character in database for user ${
          characterData.authorId
        }.\nCharacter Data: ${JSON.stringify(characterData)}`
      );
    }
    return createdCharacter;
  }
}
