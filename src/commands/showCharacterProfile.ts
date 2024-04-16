import { ComponentType, Message, type BaseMessageOptions, type ChatInputCommandInteraction } from "discord.js";
import { Duration } from "luxon";
import { RoleplayEvents, bot } from "..";
import { characterAutoComplete } from "../data/shared";
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
    if (!interaction.inCachedGuild()) return;
    const characterId = interaction.options.getNumber("character", true);

    await interaction.deferReply({ fetchReply: true });
    const user = await UserService.getOrCreateUser(interaction.user.id, true);
    const character = await CharacterService.getCharacterById(characterId);

    if (character) {
      const { buttons, selectMenu, ...messageOptions } = character.getFullCharacterProfile({
        language: user.preferredLanguage,
        isEditing: true,
        isCharOwner: user.characters?.some((char) => char.id === character.id) ?? false,
      });
      bot.emit(
        RoleplayEvents.ShowCharacterProfile,
        messageOptions,
        character,
        user,
        async (characterPanelMessage: Message) => {
          if (buttons) {
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
          if (selectMenu) {
            const selectMenuCollector = characterPanelMessage.createMessageComponentCollector({
              filter: (selectMenuInteraction) =>
                selectMenuInteraction.customId === selectMenu.customId && selectMenuInteraction.user.id === user.id,
              time: this._tenMinutes,
              componentType: ComponentType.StringSelect,
            });

            selectMenuCollector.on("collect", async (selectMenuInteraction) => {
              await selectMenu.onSelection(selectMenuInteraction);
            });
          }

          setTimeout(async () => {
            try {
              await characterPanelMessage.edit({ components: [] });
            } catch (error) {
              console.error(`Error while removing buttons from character profile message: ${error}`);
            }
          }, this._tenMinutes);
        },
        (messageOptions: BaseMessageOptions) => interaction.editReply(messageOptions),
        interaction.guildId
      );
    }
  }
}
