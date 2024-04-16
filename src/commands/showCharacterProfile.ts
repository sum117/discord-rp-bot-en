import { ComponentType, Message, type ChatInputCommandInteraction } from "discord.js";
import { Duration } from "luxon";
import type { Button } from "../components/Button";
import type { Select } from "../components/Select";
import { characterAutoComplete } from "../data/shared";
import type { User } from "../models/User";
import CharacterService from "../services/characterService";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class ShowCharacterProfile extends BaseCommand {
  private _tenMinutes = Duration.fromObject({ minutes: 10 }).as("milliseconds");
  public constructor() {
    super({
      name: "show-character-profile",
      description: "Show the profile of a character.",
      descriptionLocalizations: {
        "pt-BR": "Mostra o perfil de um personagem.",
      },
      nameLocalizations: {
        "pt-BR": "mostrar-perfil-personagem",
      },
      options: [characterAutoComplete],
      autocomplete: CharacterService.getCharacterAutocomplete,
    });
  }
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const characterId = interaction.options.getNumber("character", true);

    await interaction.deferReply({ fetchReply: true });
    const user = await UserService.getOrCreateUser(interaction.user.id, true);
    const character = await CharacterService.getCharacterById(characterId);

    if (character) {
      const { buttons, selectMenu, ...messageOptions } = character.getFullCharacterProfile({
        language: user.preferredLanguage,
        isEditing: false,
        isCharOwner: user.characters?.some((char) => char.id === character.id) ?? false,
      });
      const characterPanelMessage = await interaction.editReply(messageOptions);

      if (buttons) {
        this.createButtons(characterPanelMessage, buttons, user);
      }
      if (selectMenu) {
        this.createSelectMenu(characterPanelMessage, selectMenu, user);
      }

      setTimeout(async () => {
        try {
          await characterPanelMessage.edit({ components: [] });
        } catch (error) {
          console.error(`Error while removing buttons from character profile message: ${error}`);
        }
      }, this._tenMinutes);
    }
  }

  private createButtons(characterPanelMessage: Message<boolean>, buttons: Button[], user: User) {
    const buttonCollector = characterPanelMessage.createMessageComponentCollector({
      filter: (buttonInteraction) =>
        buttons.map((button) => button.customId).includes(buttonInteraction.customId) &&
        buttonInteraction.user.id === user.id,
      time: this._tenMinutes,
      componentType: ComponentType.Button,
    });

    buttonCollector.on("collect", async (buttonInteraction) => {
      const button = buttons.find((button) => button.customId === buttonInteraction.customId);
      if (button) {
        await button.onClick?.(buttonInteraction);
      }
    });
  }

  private createSelectMenu(characterPanelMessage: Message, selectMenu: Select, user: User) {
    const selectMenuCollector = characterPanelMessage.createMessageComponentCollector({
      filter: (selectMenuInteraction) =>
        selectMenuInteraction.customId === selectMenu.customId && selectMenuInteraction.user.id === user.id,
      time: this._tenMinutes,
      componentType: ComponentType.SelectMenu,
    });

    selectMenuCollector.on("collect", async (selectMenuInteraction) => {
      await selectMenu.onSelection(selectMenuInteraction);
    });
  }
}
