import { AutocompleteInteraction, TextInputStyle } from "discord.js";
import { SQL, eq, like } from "drizzle-orm";
import Modal, { TextInputLength } from "../components/Modal";
import { TEXT_INPUT_CUSTOM_IDS } from "../data/constants";
import db from "../database";
import { translateFactory } from "../i18n";
import { Character, type CharacterType } from "../models/Character";
import { characters, usersToCharacters } from "../schema";
import UserService from "./userService";

export default class CharacterService {
  public static getCreateCharacterModal(userOrServerLanguage: "pt-BR" | "en-US" = "pt-BR") {
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
        maxLength: TextInputLength.Medium,
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

  public static async getCurrentCharacterByUserId(userId: string) {
    const author = await UserService.getOrCreateUser(userId);
    if (!author.currentCharacterId) {
      console.log(`User ${author.id} doesn't have a character selected.`);
      return null;
    }

    const character = await this.getCharacterById(author.currentCharacterId);
    if (!character) {
      console.log(`Character with ID ${author.currentCharacterId} not found for ${author.id}.`);
      return null;
    }
    return { author, character: new Character(character) };
  }

  public static async getCharacterAutocomplete(interaction: AutocompleteInteraction, withUserGuard = true) {
    const characterName = interaction.options.getFocused();
    const characters = await CharacterService.getCharacters({
      userId: withUserGuard ? interaction.user.id : undefined,
      name: characterName,
    });
    void interaction.respond(characters.map(({ name, id }) => ({ name, value: id })));
  }
  public static async getCharacterById(characterId: number, withAuthor = false) {
    const character = await db.query.characters.findFirst({
      where: (characters, { eq }) => eq(characters.id, characterId),
      with: withAuthor ? { author: true } : {},
    });

    if (!character) {
      console.log(`Character with ID ${characterId} not found.`);
      return null;
    }

    return new Character(character);
  }

  public static async createCharacter(characterData: typeof characters.$inferInsert) {
    return await db.transaction(async (transaction) => {
      const [character] = await transaction.insert(characters).values(characterData).returning();
      if (!character) {
        transaction.rollback();
        return;
      }
      await transaction.insert(usersToCharacters).values({ characterId: character.id, userId: character.authorId });

      return new Character(character);
    });
  }

  public static async updateCharacter(data: Character | CharacterType) {
    if (data instanceof Character) {
      data = data.toJson();
    }
    const [updatedCharacter] = await db.update(characters).set(data).where(eq(characters.id, data.id)).returning();

    if (!updatedCharacter) {
      throw new Error(
        `Failed to update character in database for user ${data.authorId}.\nCharacter Data: ${JSON.stringify(data)}`,
      );
    }
    return new Character(updatedCharacter);
  }

  public static getCharacters({ name, userId }: { name?: string; userId?: string } = {}) {
    const filters: SQL[] = [];
    if (name) {
      filters.push(like(characters.name, `%${name}%`));
    }
    if (userId) {
      filters.push(eq(characters.authorId, userId));
    }
    return db.query.characters.findMany({
      orderBy: ({ id }, { asc }) => asc(id),
      where: (_table, { and }) => and(...filters),
    });
  }
}
