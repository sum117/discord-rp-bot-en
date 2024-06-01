import type { AutocompleteInteraction } from "discord.js";
import { TextInputStyle } from "discord.js";
import type { SQL } from "drizzle-orm";
import { and, eq, inArray, like } from "drizzle-orm";

import Modal, { TextInputLength } from "../components/Modal";
import { TEXT_INPUT_CUSTOM_IDS } from "../data/constants";
import db from "../database";
import { translateFactory } from "../i18n";
import { Character, type CharacterType } from "../models/Character";
import { characters, characterServerData, savedDices, usersToCharacters } from "../schema";
import { ServerService } from "./serverService";
import UserService from "./userService";

type DiceInsertData = typeof savedDices.$inferInsert;
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

  public static createCharacter(characterData: typeof characters.$inferInsert) {
    return db.transaction(async (transaction) => {
      const [character] = await transaction.insert(characters).values(characterData).returning();
      if (!character) {
        transaction.rollback();
        return;
      }
      await transaction.insert(usersToCharacters).values({ characterId: character.id, userId: character.authorId });
      return new Character(character);
    });
  }
  public static async deleteCharacterFromUser({ characterId, userId }: { characterId: number; userId: string }) {
    const [deletedCharacter] = await db
      .delete(usersToCharacters)
      .where(and(eq(usersToCharacters.characterId, characterId), eq(usersToCharacters.userId, userId)))
      .returning();

    if (!deletedCharacter) {
      throw new Error(`Failed to delete character ${characterId} from user ${userId}.`);
    }
    return deletedCharacter;
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

  public static async getCharacters({ name, userId, limit }: { limit?: number; name?: string; userId?: string } = {}) {
    const filters: SQL[] = [];
    if (name) {
      filters.push(like(characters.name, `%${name}%`));
    }
    if (userId) {
      const userToCharactersRelation = await db.query.usersToCharacters.findMany({
        where: (_table, { eq }) => eq(usersToCharacters.userId, userId),
      });
      if (userToCharactersRelation.length) {
        filters.push(
          inArray(
            characters.id,
            userToCharactersRelation.map((relation) => relation.characterId),
          ),
        );
      } else {
        return [];
      }
    }
    return db.query.characters.findMany({
      limit,
      with: { posts: true },
      orderBy: ({ level }, { desc }) => desc(level),
      where: (_table, { and }) => and(...filters),
    });
  }

  public static async addCharacterMoney({
    characterId,
    amount,
    serverId,
  }: {
    amount: number;
    characterId: number;
    serverId: string;
  }) {
    const serverData = await ServerService.getOrCreateCharacterServerData(characterId, serverId);
    return db
      .update(characterServerData)
      .set({ money: serverData.money + amount })
      .where(and(eq(characterServerData.characterId, characterId), eq(characterServerData.serverId, serverId)));
  }

  public static async giveCharacterMoney({
    hostCharacterId,
    targetCharacterId,
    serverId,
    hasPermission,
    amount,
  }: {
    amount: number;
    hasPermission: boolean;
    hostCharacterId: number;
    serverId: string;
    targetCharacterId: number;
  }) {
    if (hostCharacterId === targetCharacterId || !hasPermission) {
      return;
    }

    const hostServerData = await ServerService.getOrCreateCharacterServerData(hostCharacterId, serverId);
    if (hostServerData.money < amount) {
      return;
    }

    const targetServerData = await ServerService.getOrCreateCharacterServerData(targetCharacterId, serverId);
    await db.transaction(async (transaction) => {
      await transaction
        .update(characterServerData)
        .set({ money: hostServerData.money - amount })
        .where(and(eq(characterServerData.characterId, hostCharacterId), eq(characterServerData.serverId, serverId)));
      await transaction
        .update(characterServerData)
        .set({ money: targetServerData.money + amount })
        .where(and(eq(characterServerData.characterId, targetCharacterId), eq(characterServerData.serverId, serverId)));
    });

    return targetServerData.money + amount;
  }

  public static async removeCharacterMoney({
    characterId,
    amount,
    serverId,
  }: {
    amount: number;
    characterId: number;
    serverId: string;
  }) {
    const serverData = await ServerService.getOrCreateCharacterServerData(characterId, serverId);
    if (serverData.money < amount) {
      serverData.money = 0;
    }
    return db
      .update(characterServerData)
      .set({ money: serverData.money - amount })
      .where(and(eq(characterServerData.characterId, characterId), eq(characterServerData.serverId, serverId)));
  }

  public static async getCharacterMoney({ characterId, serverId }: { characterId: number; serverId: string }) {
    const serverData = await ServerService.getOrCreateCharacterServerData(characterId, serverId);
    return serverData.money;
  }

  public static async createCharacterDice({ characterId, name, dice, description }: DiceInsertData) {
    const [data] = await db.insert(savedDices).values({ characterId, name, dice, description }).returning();
    return data;
  }
}
