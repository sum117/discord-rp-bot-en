import { characterAutoComplete } from "@/data/shared";
import CharacterService from "@/services/characterService";
import UserService from "@/services/userService";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { BaseCommand } from "./baseCommand";
import { Button } from "@/components/Button";
import { Duration } from "luxon";
import { BUTTON_CUSTOM_IDS } from "@/data/constants";

export default class DeleteCharacterCommand extends BaseCommand {
  public constructor() {
    super({
      name: "delete-character",
      nameLocalizations: {
        "pt-BR": "deletar-personagem",
      },
      description: "Delete a character from the user.",
      descriptionLocalizations: {
        "pt-BR": "Deleta um personagem do usuário.",
      },
      options: [characterAutoComplete],
      autocomplete: CharacterService.getCharacterAutocomplete,
    });
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const characterId = interaction.options.getNumber("character", true);
    await interaction.deferReply({ ephemeral: true, fetchReply: true });

    const user = await UserService.getOrCreateUser(interaction.user.id, true);
    const translate = user.getTranslateFunction();

    const character = await CharacterService.getCharacterById(characterId);
    if (!user.ownsCharacter(characterId) || !character) {
      await interaction.editReply(translate("characterNotFound"));
      return;
    }

    const message = new EmbedBuilder()
      .setTitle(translate("characterDelete", { characterName: character.name }))
      .setDescription(
        translate("confirmDelete", { characterName: character.name, characterId, characterLevel: character.level }),
      );

    const confirmButton = new Button({
      customId: BUTTON_CUSTOM_IDS.confirmDelete,
      label: translate("confirm"),
      onClick: async () => {
        await CharacterService.deleteCharacterFromUser({ userId: user.id, characterId });
        void interaction.editReply({
          content: translate("characterDeleted", { characterName: character.name }),
          components: [],
          embeds: [],
        });
      },
    });

    const cancelButton = new Button({
      customId: BUTTON_CUSTOM_IDS.cancelDelete,
      label: translate("cancel"),
      onClick: async () => {
        void interaction.editReply({ content: translate("characterDeleteCanceled"), components: [], embeds: [] });
      },
    });

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents([
      confirmButton.getAPIComponent(),
      cancelButton.getAPIComponent(),
    ]);

    const reply = await interaction.editReply({ embeds: [message], components: [components] });

    const collector = reply.createMessageComponentCollector({
      filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
      time: Duration.fromObject({ minutes: 5 }).as("milliseconds"),
      componentType: ComponentType.Button,
      max: 1,
    });

    collector.on("collect", async (buttonInteraction) => {
      await buttonInteraction.deferReply({ ephemeral: true });
      if (buttonInteraction.customId === BUTTON_CUSTOM_IDS.confirmDelete) {
        await confirmButton.onClick?.(buttonInteraction);
      } else if (buttonInteraction.customId === BUTTON_CUSTOM_IDS.cancelDelete) {
        await cancelButton.onClick?.(buttonInteraction);
      }
      await buttonInteraction.deleteReply();
    });
  }
}
