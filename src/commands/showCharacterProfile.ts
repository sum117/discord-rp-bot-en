import { ComponentType, type ChatInputCommandInteraction } from "discord.js";
import { Duration } from "luxon";
import { characterAutoComplete } from "../data/shared";
import CharacterService from "../services/characterService";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class ShowCharacterProfile extends BaseCommand {
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
      const { buttons, ...messageOptions } = character.getFullCharacterProfile(
        user.preferredLanguage
      );
      const characterPanelMessage = await interaction.editReply(messageOptions);
      if (buttons) {
        const tenMinutes = Duration.fromObject({ minutes: 10 }).as(
          "milliseconds"
        );

        const buttonCollector =
          characterPanelMessage.createMessageComponentCollector({
            filter: (buttonInteraction) =>
              buttons
                .map((button) => button.customId)
                .includes(buttonInteraction.customId) &&
              buttonInteraction.user.id === user.id,
            time: tenMinutes,
            componentType: ComponentType.Button,
          });

        buttonCollector.on("collect", async (buttonInteraction) => {
          const button = buttons.find(
            (button) => button.customId === buttonInteraction.customId
          );
          if (button) {
            await button.onClick?.(buttonInteraction);
          }
        });

        setTimeout(async () => {
          try {
            await characterPanelMessage.edit({ components: [] });
          } catch (error) {
            console.error(
              `Error while removing buttons from character profile message: ${error}`
            );
          }
        }, tenMinutes);
      }
    }
  }
}
