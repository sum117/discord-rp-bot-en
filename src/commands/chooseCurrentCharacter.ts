import { ChatInputCommandInteraction } from "discord.js";
import {
  CHARACTER_AUTO_COMPLETE_NAME,
  characterAutoComplete,
} from "../data/shared";
import CharacterService from "../services/characterService";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class ChooseCurrentCharacter extends BaseCommand {
  public constructor() {
    super({
      name: "choose-current-character",
      description: "Choose the current character to be used in the playcard.",
      descriptionLocalizations: {
        "pt-BR": "Escolhe o personagem atual a ser utilizado no playcard.",
      },
      nameLocalizations: {
        "pt-BR": "escolher-personagem-atual",
      },
      options: [characterAutoComplete],
      autocomplete: CharacterService.getCharacterAutocomplete,
    });
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const characterId = interaction.options.getNumber(
      CHARACTER_AUTO_COMPLETE_NAME,
      true
    );
    await interaction.deferReply({ ephemeral: true });
    const user = await UserService.getOrCreateUser(interaction.user.id, true);
    const translate = user.getTranslateFunction();

    const hasCharacter = user.characters?.some(
      (character) => character.id === characterId
    );
    if (!hasCharacter) {
      await interaction.editReply({
        content: translate("characterNotFound"),
      });
    }
    const character = await CharacterService.getCharacterById(characterId);
    if (character) {
      user.currentCharacterId = character.id;
      await UserService.updateUser(user);
      await interaction.editReply({
        content: translate("currentCharacterSet", {
          characterName: character.name,
        }),
      });
    }
  }
}
